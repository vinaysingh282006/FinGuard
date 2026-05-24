import { API_CONFIG, API_URLS, isValidKey, secureRequest } from '../config/api';
import { marketStreamService } from './marketStreamService';

let pollingInterval: any = null;

export interface PriceData {
  BTC: number;
  ETH: number;
  SOL: number;
  USDT: number;
}

/**
 * Fetch token prices from CoinGecko with optional API key injection
 */
export async function fetchCoinGeckoPrices(): Promise<Partial<PriceData>> {
  const hasKey = isValidKey(API_CONFIG.COINGECKO_API_KEY);
  const headers: Record<string, string> = {};
  
  if (hasKey) {
    // Inject CoinGecko demo key in standard header
    headers['x-cg-demo-api-key'] = API_CONFIG.COINGECKO_API_KEY;
  }

  try {
    const data = await secureRequest<any>({
      url: `${API_URLS.COINGECKO}/simple/price`,
      method: 'GET',
      apiName: 'CoinGecko',
      cacheTtlMs: 15000, // Cache for 15 seconds to prevent rate limits
      headers,
      params: {
        ids: 'bitcoin,ethereum,solana',
        vs_currencies: 'usd',
      },
    });

    if (data) {
      return {
        BTC: data.bitcoin?.usd,
        ETH: data.ethereum?.usd,
        SOL: data.solana?.usd,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch initial crypto prices from CoinGecko.', error);
  }

  return {};
}

/**
 * Start price polling backup and live WebSocket stream
 */
export function startPricePolling(store: any) {
  if (pollingInterval) clearInterval(pollingInterval);

  const fetchAndSetPrices = async () => {
    const prices = await fetchCoinGeckoPrices();
    const updatedPrices: Partial<PriceData> = {};

    if (prices.BTC) updatedPrices.BTC = prices.BTC;
    if (prices.ETH) updatedPrices.ETH = prices.ETH;
    if (prices.SOL) updatedPrices.SOL = prices.SOL;

    if (Object.keys(updatedPrices).length > 0) {
      store.setPrices(updatedPrices);
    }
  };

  // Perform initial fetch
  fetchAndSetPrices();

  // Poll backup every 120 seconds in case WS disconnects
  pollingInterval = setInterval(fetchAndSetPrices, 120000);

  // Subscribe to Binance price ticker WebSocket for real-time tick updates!
  marketStreamService.startPriceTicker((data) => {
    if (data && data.s && data.c) {
      const symbol = data.s;
      const price = parseFloat(data.c);
      
      if (symbol === 'BTCUSDT') {
        store.setPrices({ BTC: price });
      } else if (symbol === 'ETHUSDT') {
        store.setPrices({ ETH: price });
      } else if (symbol === 'SOLUSDT') {
        store.setPrices({ SOL: price });
      }
    }
  });
}

/**
 * Stop price polling and disconnect WebSocket
 */
export function stopPricePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  marketStreamService.stopPriceTicker();
}
