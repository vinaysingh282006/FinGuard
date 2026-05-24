import { scoreFraud } from './fraudScoring';

let demoTimeouts = [];

export function startDemoSequence(store) {
  // Clear any existing running demo
  stopDemoSequence(store);
  store.setDemoActive(true);

  const chains = ['BTC', 'ETH', 'SOL', 'USDT'];

  const triggerTx = (txData) => {
    const scored = scoreFraud({
      timestamp: new Date().toISOString(),
      hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      isSimulated: true,
      ...txData
    });
    store.addTransaction(scored);

    // If critical/high, trigger alert
    if (scored.fraudScore >= 61) {
      store.addAlert({
        id: Math.random().toString(),
        isSimulated: true,
        timestamp: scored.timestamp,
        hash: scored.hash,
        from: scored.from,
        to: scored.to,
        chain: scored.chain,
        valueUsd: scored.valueUsd,
        fraudScore: scored.fraudScore,
        threatLevel: scored.threatLevel,
        reason: scored.rulesTriggered[0] || 'High Risk Activity'
      });
    }

    // If whale volume, trigger whale alert
    if (scored.valueUsd >= 1000000) {
      store.addWhaleAlert({
        id: Math.random().toString(),
        isSimulated: true,
        timestamp: scored.timestamp,
        hash: scored.hash,
        from: scored.from,
        to: scored.to,
        chain: scored.chain,
        valueUsd: scored.valueUsd,
        threatLevel: scored.threatLevel
      });
    }
  };

  // Timeline events:
  // 0s: Critical Whale transfer
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'BTC',
        from: '1Lbcfr7sAHTD9CgdQo4VFpY67dN26Z5c6K',
        to: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
        value: '52.40',
        valueUsd: 5135200,
        hopCount: 2
      });
    }, 100)
  );

  // 4s: Tornado Cash mixer deposit
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'ETH',
        from: '0x3F8a5d3A2B1C2d8B5c7E9fA0b1c9F7A2c3B4C5D6E',
        to: '0x905Ab8EBFED5d11A13C25D414e251DaFE3b00C6B', // Tornado Cash
        value: '350.00',
        valueUsd: 1092000,
        hopCount: 1
      });
    }, 4000)
  );

  // 8s: Smurfing sequence - Tx 1
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'USDT',
        from: '0x99e5f7a2d3c4b5e6a7f888e2e06bebfca1c18dbd7',
        to: '0xabc123d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        value: '9,850.00',
        valueUsd: 9850,
        velocityCount: 12
      });
    }, 8000)
  );

  // 10s: Smurfing sequence - Tx 2
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'USDT',
        from: '0x99e5f7a2d3c4b5e6a7f888e2e06bebfca1c18dbd7',
        to: '0xdef456a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
        value: '9,720.00',
        valueUsd: 9720,
        velocityCount: 12
      });
    }, 10000)
  );

  // 12s: Smurfing sequence - Tx 3
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'USDT',
        from: '0x99e5f7a2d3c4b5e6a7f888e2e06bebfca1c18dbd7',
        to: '0x789012abcdef0123456789abcdef0123456789ab',
        value: '9,900.00',
        valueUsd: 9900,
        velocityCount: 12
      });
    }, 12000)
  );

  // 16s: Sanction list hit
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'ETH',
        from: '0x7F1dD3A1B2C8d8B5c7E9fA0b1c9F7A2c3B4C5D6E', // Sanctioned address
        to: '0x00d4f5b7c89a0123456789abcdef0123456789ab',
        value: '45.00',
        valueUsd: 140400,
        hopCount: 3
      });
    }, 16000)
  );

  // 20s: Circular laundering routing (Node loop)
  demoTimeouts.push(
    setTimeout(() => {
      triggerTx({
        chain: 'SOL',
        from: 'origin_address_circular_loop',
        to: 'hop_address_circular_loop',
        value: '680.00',
        valueUsd: 149900,
        hopCount: 5
      });
    }, 20000)
  );

  // Auto end demo at 25s
  demoTimeouts.push(
    setTimeout(() => {
      store.setDemoActive(false);
    }, 25000)
  );
}

export function stopDemoSequence(store) {
  demoTimeouts.forEach(clearTimeout);
  demoTimeouts = [];
  store.setDemoActive(false);
}
