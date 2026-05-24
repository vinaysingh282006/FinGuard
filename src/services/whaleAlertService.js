import axios from 'axios';

let whaleInterval = null;

export function startWhaleMonitoring(store) {
  if (whaleInterval) clearInterval(whaleInterval);

  const apiKey = import.meta.env.VITE_WHALE_ALERT_API_KEY;

  const fetchWhales = async () => {
    // If Whale Alert API Key is provided, use it
    if (apiKey && apiKey !== 'your_whale_alert_api_key_here' && apiKey !== 'your_github_secret_whale_alert_key_here') {
      try {
        const startSecs = Math.floor(Date.now() / 1000) - 180; // past 3 minutes
        const response = await axios.get(
          `https://api.whale-alert.io/v1/status?api_key=${apiKey}` // Check status first or query txs
        );
        
        const txResponse = await axios.get(
          `https://api.whale-alert.io/v1/transactions?min_value=500000&api_key=${apiKey}&start=${startSecs}`
        );
        
        if (txResponse.data && Array.isArray(txResponse.data.transactions)) {
          txResponse.data.transactions.forEach((tx) => {
            const whaleAlert = {
              id: tx.id ? String(tx.id) : String(tx.hash),
              timestamp: new Date(tx.timestamp * 1000).toISOString(),
              hash: tx.hash,
              from: tx.from?.owner || tx.from?.address || 'Unknown Whale',
              to: tx.to?.owner || tx.to?.address || 'Unknown Wallet',
              chain: tx.blockchain.toUpperCase(),
              valueUsd: tx.amount_usd,
              threatLevel: tx.amount_usd > 3000000 ? 'CRITICAL' : 'HIGH RISK'
            };
            store.addWhaleAlert(whaleAlert);
          });
        }
      } catch (error) {
        console.warn('Failed to fetch from Whale Alert API, fallback to public on-chain filter active.', error);
        fetchPublicWhaleFallback();
      }
    } else {
      // Fallback: poll recent blocks and identify real transactions exceeding $100k USD
      fetchPublicWhaleFallback();
    }
  };

  const fetchPublicWhaleFallback = async () => {
    try {
      const btcPrice = store.prices.BTC || 95000;
      // Fetch recent unconfirmed transactions from Mempool.space
      const recentTxResponse = await axios.get('https://mempool.space/api/mempool/recent');
      if (Array.isArray(recentTxResponse.data)) {
        recentTxResponse.data.forEach((tx) => {
          const valueUsd = (tx.value / 1e8) * btcPrice;
          // Filter only large on-chain transfers (> $100k USD)
          if (valueUsd >= 100000) {
            const whaleAlert = {
              id: 'whale_btc_' + tx.txid.substring(0, 10) + '_' + Date.now(),
              timestamp: new Date().toISOString(),
              hash: tx.txid,
              from: 'BTC_Whale_Node_' + tx.txid.substring(0, 6),
              to: 'BTC_Egress_Node_' + tx.txid.substring(26, 32),
              chain: 'BTC',
              valueUsd,
              threatLevel: valueUsd > 1000000 ? 'CRITICAL' : 'HIGH RISK'
            };
            store.addWhaleAlert(whaleAlert);
          }
        });
      }
    } catch (e) {
      console.warn('Whale fallback polling error:', e);
    }
  };

  fetchWhales();
  // Poll every 25 seconds for new whale activity
  whaleInterval = setInterval(fetchWhales, 25000);
}

export function stopWhaleMonitoring() {
  if (whaleInterval) {
    clearInterval(whaleInterval);
    whaleInterval = null;
  }
}
