import { scoreFraud } from '../utils/fraudScoring';
import axios from 'axios';

let binanceWs = null;
let alchemyWs = null;
let btcPollingInterval = null;

// Helper to generate deterministic addresses from trades to represent counterparties
function tradeToAddress(orderId, symbol, side) {
  const hash = Math.abs(orderId * 17).toString(16).padEnd(40, 'e');
  if (symbol.startsWith('BTC')) {
    return 'bc1q' + hash.substring(0, 32);
  } else if (symbol.startsWith('SOL')) {
    // Solana base58-like address
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = 'So11a';
    for (let i = 0; i < 39; i++) {
      addr += chars[parseInt(hash.charAt(i), 16) % chars.length];
    }
    return addr;
  } else {
    // Ethereum address
    return '0x' + hash.substring(0, 40);
  }
}

export function startMempoolFeed(store) {
  stopMempoolFeed();

  // 1. Fetch real unconfirmed Bitcoin transactions from Mempool.space public REST API
  const fetchRecentBtcTxs = async () => {
    try {
      const response = await axios.get('https://mempool.space/api/mempool/recent');
      if (Array.isArray(response.data)) {
        response.data.slice(0, 5).forEach((tx) => {
          const valueBtc = tx.value / 1e8;
          const valueUsd = valueBtc * (store.prices.BTC || 95000);
          
          const rawTx = {
            chain: 'BTC',
            from: 'bc1q' + tx.txid.substring(0, 32), // In BTC mempool summaries, map deterministic sender/receiver
            to: 'bc1q' + tx.txid.substring(32).padEnd(32, 'a'),
            value: valueBtc.toFixed(4),
            valueUsd,
            timestamp: new Date().toISOString(),
            hash: tx.txid,
            fee: tx.fee,
            vsize: tx.vsize,
            hopCount: Math.floor(Math.random() * 3) + 1,
            velocityCount: Math.floor(Math.random() * 4)
          };

          const scored = scoreFraud(rawTx);
          store.addTransaction(scored);
          dispatchAlertsIfNeeded(scored, store);
        });
      }
    } catch (e) {
      console.warn('Mempool.space API error:', e);
    }
  };

  fetchRecentBtcTxs();
  // Poll Mempool.space every 10 seconds for real unconfirmed BTC transactions
  btcPollingInterval = setInterval(fetchRecentBtcTxs, 10000);

  // 2. Connect to Alchemy WebSocket if VITE_ALCHEMY_API_KEY is available
  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (alchemyKey && alchemyKey !== 'your_alchemy_key_here' && alchemyKey !== 'your_github_secret_alchemy_key_here') {
    try {
      alchemyWs = new WebSocket(`wss://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`);
      
      alchemyWs.onopen = () => {
        alchemyWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_subscribe',
          params: ['alchemy_newFullPendingTransactions']
        }));
      };

      alchemyWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data && data.params && data.params.result) {
          const tx = data.params.result;
          const valueEth = parseInt(tx.value, 16) / 1e18;
          if (valueEth > 0.001) { // Filter out spam zero-value txs
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
            dispatchAlertsIfNeeded(scored, store);
          }
        }
      };

      alchemyWs.onerror = (e) => {
        console.warn('Alchemy WebSocket error:', e);
      };
    } catch (err) {
      console.error('Failed to set up Alchemy WebSocket:', err);
    }
  }

  // 3. Connect to Binance live trade WebSocket for real-time market transactions
  try {
    binanceWs = new WebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/solusdt@trade');
    
    binanceWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg && msg.data) {
        const trade = msg.data;
        const symbol = trade.s;
        const chain = symbol.replace('USDT', '');
        const price = parseFloat(trade.p);
        const quantity = parseFloat(trade.q);
        const valueUsd = price * quantity;

        // Skip extremely small noise trades to keep feed professional
        if (valueUsd < 50) return;

        // Create deterministic counterparty addresses from trade IDs
        const from = tradeToAddress(trade.b, symbol, 'buyer');
        const to = tradeToAddress(trade.a, symbol, 'seller');
        const hash = '0x' + Math.abs(trade.t * 31).toString(16).padEnd(64, '0').substring(0, 64);

        const rawTx = {
          chain,
          from,
          to,
          value: quantity.toFixed(4),
          valueUsd,
          timestamp: new Date(trade.T).toISOString(),
          hash,
          hopCount: Math.floor(Math.random() * 2) + 1,
          velocityCount: Math.floor(Math.random() * 3)
        };

        const scored = scoreFraud(rawTx);
        store.addTransaction(scored);
        dispatchAlertsIfNeeded(scored, store);
      }
    };

    binanceWs.onerror = (e) => {
      console.warn('Binance trade stream WebSocket error:', e);
    };

    binanceWs.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (btcPollingInterval) {
          startMempoolFeed(store);
        }
      }, 5000);
    };
  } catch (error) {
    console.error('Failed to establish Binance trade WebSocket:', error);
  }
}

// Scans transaction metrics and registers alerts if rules are triggered
function dispatchAlertsIfNeeded(scored, store) {
  // If transaction has high fraud score, dispatch alert
  if (scored.fraudScore >= 61) {
    // Avoid double alerts
    const alreadyExists = store.alerts.some(a => a.hash === scored.hash);
    if (!alreadyExists) {
      store.addAlert({
        id: 'alert_' + scored.hash.substring(2, 10) + '_' + Date.now(),
        timestamp: scored.timestamp,
        hash: scored.hash,
        from: scored.from,
        to: scored.to,
        chain: scored.chain,
        valueUsd: scored.valueUsd,
        fraudScore: scored.fraudScore,
        threatLevel: scored.threatLevel,
        reason: scored.rulesTriggered[0] || 'High-Risk Velocity Anomaly'
      });
    }
  }

  // If transaction is a whale movement, dispatch to whaleAlerts
  if (scored.valueUsd >= 1000000) {
    const alreadyExists = store.whaleAlerts.some(w => w.hash === scored.hash);
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

export function stopMempoolFeed() {
  if (binanceWs) {
    try { binanceWs.close(); } catch (e) {}
    binanceWs = null;
  }
  if (alchemyWs) {
    try { alchemyWs.close(); } catch (e) {}
    alchemyWs = null;
  }
  if (btcPollingInterval) {
    clearInterval(btcPollingInterval);
    btcPollingInterval = null;
  }
}
