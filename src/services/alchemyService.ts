import { API_CONFIG, API_URLS, isValidKey, dispatchSystemAlert } from '../config/api';

class AlchemyService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;

  /**
   * Start Alchemy pending transaction stream
   */
  startPendingTxStream(onMessage: (tx: any) => void) {
    this.stopPendingTxStream();

    const key = API_CONFIG.ALCHEMY_API_KEY;
    if (!isValidKey(key)) {
      console.log('Alchemy WebSocket pending stream disabled: VITE_ALCHEMY_API_KEY is not configured.');
      return;
    }

    const wsUrl = `${API_URLS.ALCHEMY_WS}/${key}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Alchemy WebSocket pending stream connection established.');
        this.reconnectAttempts = 0;
        this.ws?.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_subscribe',
            params: ['alchemy_newFullPendingTransactions'],
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.params && data.params.result) {
            onMessage(data.params.result);
          }
        } catch (e) {
          console.warn('Failed to parse Alchemy WS message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.warn('Alchemy WebSocket connection error:', e);
      };

      this.ws.onclose = () => {
        if (this.ws) {
          this.reconnectAttempts++;
          const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
          console.log(`Alchemy WebSocket disconnected. Reconnecting in ${delay}ms...`);
          
          dispatchSystemAlert(
            'ALCHEMY FEED DISRUPTED',
            `Real-time Ethereum mempool connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`,
            'warning'
          );

          setTimeout(() => this.startPendingTxStream(onMessage), delay);
        }
      };
    } catch (err: any) {
      console.error('Failed to establish Alchemy WebSocket connection:', err);
      dispatchSystemAlert(
        'ALCHEMY SETUP ERROR',
        `Could not initialize real-time security node: ${err.message || 'Unknown error'}`,
        'error'
      );
    }
  }

  /**
   * Stop Alchemy pending transaction stream
   */
  stopPendingTxStream() {
    if (this.ws) {
      const socket = this.ws;
      this.ws = null; // Prevent reconnect loop
      try {
        socket.close();
      } catch (e) {}
    }
  }
}

export const alchemyService = new AlchemyService();
export default alchemyService;
