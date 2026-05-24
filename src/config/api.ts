import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useStore } from '../store/useStore';

// 1. Central API Configuration Object
const metaEnv = (import.meta as any).env || {};

export const API_CONFIG = {
  GEMINI_API_KEY: metaEnv.VITE_GEMINI_API_KEY || '',
  ETHERSCAN_API_KEY: metaEnv.VITE_ETHERSCAN_API_KEY || '',
  ALCHEMY_API_KEY: metaEnv.VITE_ALCHEMY_API_KEY || '',
  COINGECKO_API_KEY: metaEnv.VITE_COINGECKO_API_KEY || '',
  HELIUS_API_KEY: metaEnv.VITE_HELIUS_API_KEY || '',
};

// Base URLs
export const API_URLS = {
  ETHERSCAN: '/api/etherscan', // Uses Vite local proxy to avoid CORS, fallbacks handled
  ETHERSCAN_DIRECT: 'https://api.etherscan.io/api',
  COINGECKO: 'https://api.coingecko.com/api/v3',
  ALCHEMY_WS: 'wss://eth-mainnet.g.alchemy.com/v2',
  BINANCE_WS: 'wss://stream.binance.com:9443',
  MEMPOOL: 'https://mempool.space/api',
  HELIUS_RPC: 'https://mainnet.helius-rpc.com/?api-key=',
  CLOUDFLARE_ETH_RPC: 'https://cloudflare-eth.com',
};

// 2. Validate Keys (Excludes placeholders and empty values)
export function isValidKey(key: string | undefined | null): boolean {
  if (!key) return false;
  const clean = key.trim().toLowerCase();
  const placeholders = [
    'your_gemini_api_key_here',
    'your_github_secret_gemini_key_here',
    'your_etherscan_key_here',
    'your_github_secret_etherscan_key_here',
    'your_alchemy_key_here',
    'your_github_secret_alchemy_key_here',
    'your_coingecko_key_here',
    'your_github_secret_coingecko_key_here',
    'your_helius_api_key_here',
    'your_github_secret_helius_key_here',
    'your_whale_alert_api_key_here',
    'your_github_secret_whale_alert_key_here'
  ];
  return clean !== '' && !placeholders.includes(clean);
}

// 3. Simple In-Memory TTL Cache
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: any, ttlMs: number): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new MemoryCache();

// 4. Global Alert Dispatcher (Cinematic warnings)
export function dispatchSystemAlert(title: string, message: string, type: 'warning' | 'error' = 'warning') {
  try {
    const store = useStore.getState();
    if (store && typeof store.setSystemAlert === 'function') {
      store.setSystemAlert({
        type,
        title,
        message,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  } catch (err) {
    console.error('Failed to dispatch system alert:', err);
  }
}

export function dismissSystemAlert() {
  try {
    const store = useStore.getState();
    if (store && typeof store.clearSystemAlert === 'function') {
      store.clearSystemAlert();
    }
  } catch (err) {
    console.error('Failed to clear system alert:', err);
  }
}

// 5. Rate Limiting Request Queue Manager (Throttling)
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private minIntervalMs = 250; // Max 4 requests per second default

  enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs));
      }
    }

    this.processing = false;
  }
}

const apiQueue = new RequestQueue();

// 6. Resilient HTTP Request Helper (with Retry, Backoff, Throttling, Caching, and Fallback)
export interface RequestOptions extends AxiosRequestConfig {
  apiName?: string;
  cacheTtlMs?: number; // Enable caching if set
  bypassQueue?: boolean;
  retries?: number;
  retryDelayMs?: number;
}

export async function secureRequest<T>(options: RequestOptions): Promise<T> {
  const {
    url = '',
    method = 'GET',
    apiName = 'General',
    cacheTtlMs = 0,
    bypassQueue = false,
    retries = 3,
    retryDelayMs = 1000,
    ...axiosConfig
  } = options;

  // Check cache first
  const cacheKey = `${method}:${url}:${JSON.stringify(axiosConfig.params || '')}:${JSON.stringify(axiosConfig.data || '')}`;
  if (cacheTtlMs > 0 && method === 'GET') {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData !== null) {
      console.log(`[Cache Hit] ${apiName} request loaded from cache:`, url);
      return cachedData as T;
    }
  }

  // Execute request with retry and backoff
  const executeCall = async (): Promise<T> => {
    let attempt = 0;
    const run = async (): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await axios({
          url,
          method,
          ...axiosConfig,
        });
        
        // Cache response if TTL is set
        if (cacheTtlMs > 0 && method === 'GET' && response.data) {
          apiCache.set(cacheKey, response.data, cacheTtlMs);
        }

        // Successfully recovered, clear system alert if it matches
        dismissSystemAlert();
        return response.data;
      } catch (error: any) {
        attempt++;
        if (attempt <= retries) {
          const waitTime = retryDelayMs * Math.pow(2, attempt - 1);
          console.warn(`[${apiName} API Attempt ${attempt}/${retries} failed]. Retrying in ${waitTime}ms...`, error.message);
          dispatchSystemAlert(
            `${apiName.toUpperCase()} CONNECTION WARNING`,
            `Request to server failed (${error.message}). Retrying connection (Attempt ${attempt}/${retries})...`,
            'warning'
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return run();
        }

        // Exhausted all retries
        console.error(`[${apiName} API Failed after ${retries} attempts]`, error);
        dispatchSystemAlert(
          `${apiName.toUpperCase()} CONNECTION ERROR`,
          `Security node connection lost: ${error.message || 'Server unreachable'}. Switching to localized backup telemetry.`,
          'error'
        );
        throw error;
      }
    };
    return run();
  };

  // Dispatch through throttle queue unless bypassed
  if (bypassQueue) {
    return executeCall();
  } else {
    return apiQueue.enqueue(executeCall);
  }
}
