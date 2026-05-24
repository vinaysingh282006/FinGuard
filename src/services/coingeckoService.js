import axios from 'axios';

let pollingInterval = null;
let priceWs = null;

export function startPricePolling(store) {
  if (pollingInterval) clearInterval(pollingInterval);
  if (priceWs) {
    try { priceWs.close(); } catch (e) {}
    priceWs = null;
  }

  // Initial fetch from CoinGecko
  const fetchPrices = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
      );
      if (response.data) {
        store.setPrices({
          BTC: response.data.bitcoin?.usd || store.prices.BTC,
          ETH: response.data.ethereum?.usd || store.prices.ETH,
          SOL: response.data.solana?.usd || store.prices.SOL,
        });
      }
    } catch (error) {
      console.warn('Failed to fetch initial crypto prices from CoinGecko.', error);
    }
  };

  fetchPrices();
  // Poll backup every 120 seconds in case WS disconnects
  pollingInterval = setInterval(fetchPrices, 120000);

  // Connect to Binance live ticker WebSocket for real-time tick updates!
  try {
    priceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker');
    
    priceWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
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
    };

    priceWs.onerror = (e) => {
      console.warn('Binance price ticker WebSocket error:', e);
    };

    priceWs.onclose = () => {
      // Auto-reconnect after 10 seconds if closed
      setTimeout(() => {
        // Only reconnect if store is still active and priceWs hasn't been set to null by stopPricePolling
        if (pollingInterval) {
          startPricePolling(store);
        }
      }, 10000);
    };
  } catch (error) {
    console.error('Failed to establish Binance price WebSocket:', error);
  }
}

export function stopPricePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (priceWs) {
    try { priceWs.close(); } catch (e) {}
    priceWs = null;
  }
}
