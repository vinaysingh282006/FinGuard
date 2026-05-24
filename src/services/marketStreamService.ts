import { API_URLS } from '../config/api';

class MarketStreamService {
  private priceWs: WebSocket | null = null;
  private tradeWs: WebSocket | null = null;
  private priceReconnectAttempts = 0;
  private tradeReconnectAttempts = 0;
  private maxReconnectDelay = 30000; // Cap backoff at 30s

  /**
   * Start Binance price tickers WebSocket connection
   */
  startPriceTicker(onMessage: (data: any) => void) {
    this.stopPriceTicker();

    const wsUrl = `${API_URLS.BINANCE_WS}/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker`;
    
    try {
      this.priceWs = new WebSocket(wsUrl);

      this.priceWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
          this.priceReconnectAttempts = 0; // Reset count on success
        } catch (e) {
          console.warn('Failed to parse Binance ticker message:', e);
        }
      };

      this.priceWs.onerror = (e) => {
        console.warn('Binance price ticker WebSocket error:', e);
      };

      this.priceWs.onclose = () => {
        // Only reconnect if this instance hasn't been closed intentionally
        if (this.priceWs) {
          this.priceReconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.priceReconnectAttempts - 1), this.maxReconnectDelay);
          console.log(`Binance price WebSocket closed. Reconnecting in ${delay}ms...`);
          setTimeout(() => this.startPriceTicker(onMessage), delay);
        }
      };
    } catch (err) {
      console.error('Failed to create Binance price ticker WebSocket:', err);
    }
  }

  /**
   * Stop price tickers WebSocket
   */
  stopPriceTicker() {
    if (this.priceWs) {
      const ws = this.priceWs;
      this.priceWs = null; // Prevent reconnect loop
      try {
        ws.close();
      } catch (e) {}
    }
  }

  /**
   * Start Binance live trades WebSocket connection
   */
  startTradeFeed(onMessage: (data: any) => void) {
    this.stopTradeFeed();

    const wsUrl = `${API_URLS.BINANCE_WS}/stream?streams=btcusdt@trade/ethusdt@trade/solusdt@trade`;

    try {
      this.tradeWs = new WebSocket(wsUrl);

      this.tradeWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.data) {
            onMessage(msg.data);
            this.tradeReconnectAttempts = 0; // Reset count on success
          }
        } catch (e) {
          console.warn('Failed to parse Binance trade message:', e);
        }
      };

      this.tradeWs.onerror = (e) => {
        console.warn('Binance trade stream WebSocket error:', e);
      };

      this.tradeWs.onclose = () => {
        if (this.tradeWs) {
          this.tradeReconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.tradeReconnectAttempts - 1), this.maxReconnectDelay);
          console.log(`Binance trade WebSocket closed. Reconnecting in ${delay}ms...`);
          setTimeout(() => this.startTradeFeed(onMessage), delay);
        }
      };
    } catch (err) {
      console.error('Failed to establish Binance trade WebSocket:', err);
    }
  }

  /**
   * Stop trade feed WebSocket
   */
  stopTradeFeed() {
    if (this.tradeWs) {
      const ws = this.tradeWs;
      this.tradeWs = null; // Prevent reconnect loop
      try {
        ws.close();
      } catch (e) {}
    }
  }
}

export const marketStreamService = new MarketStreamService();
export default marketStreamService;
