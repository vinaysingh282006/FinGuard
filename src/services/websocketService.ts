import { alchemyService } from './alchemyService';
import { marketStreamService } from './marketStreamService';
import { scoreFraud } from '../utils/fraudScoring';

export const websocketService = {
  /**
   * Start live blockchain and crypto price tickers
   */
  startAllStreams(store: any) {
    console.log('Central WebSockets: Connecting live blockchain feeds...');

    // 1. Ethereum Mempool Stream via Alchemy
    alchemyService.startPendingTxStream((tx) => {
      if (!tx) return;
      const valueEth = parseInt(tx.value, 16) / 1e18;
      if (valueEth > 0.001) { // Filter noise
        const valueUsd = valueEth * (store.prices.ETH || 3100);
        const rawTx = {
          chain: 'ETH',
          from: tx.from,
          to: tx.to || 'Contract Deployment',
          value: valueEth.toFixed(4),
          valueUsd,
          timestamp: new Date().toISOString(),
          hash: tx.hash,
          gas: parseInt(tx.gas, 16),
          gasPrice: parseInt(tx.gasPrice || '0', 16),
          hopCount: Math.floor(Math.random() * 4) + 1,
          velocityCount: Math.floor(Math.random() * 5)
        };

        const scored = scoreFraud(rawTx);
        store.addTransaction(scored);

        // Whale trigger
        if (valueUsd >= 1000000) {
          const alreadyExists = store.whaleAlerts.some((w: any) => w.hash === scored.hash);
          if (!alreadyExists) {
            store.addWhaleAlert({
              id: 'whale_' + scored.hash.substring(2, 10) + '_' + Date.now(),
              timestamp: scored.timestamp,
              hash: scored.hash,
              from: scored.from,
              to: scored.to,
              chain: scored.chain,
              valueUsd: scored.valueUsd,
              threatLevel: scored.threatLevel
            });
          }
        }
      }
    });

    // 2. Binance live tickers for prices
    marketStreamService.startPriceTicker((ticker) => {
      if (ticker && ticker.s && ticker.c) {
        const price = parseFloat(ticker.c);
        if (ticker.s === 'BTCUSDT') {
          store.setPrices({ BTC: price });
        } else if (ticker.s === 'ETHUSDT') {
          store.setPrices({ ETH: price });
        } else if (ticker.s === 'SOLUSDT') {
          store.setPrices({ SOL: price });
        }
      }
    });
  },

  /**
   * Disconnect all active streams
   */
  stopAllStreams() {
    console.log('Central WebSockets: Disconnecting live feeds...');
    alchemyService.stopPendingTxStream();
    marketStreamService.stopPriceTicker();
    marketStreamService.stopTradeFeed();
  }
};

export default websocketService;
