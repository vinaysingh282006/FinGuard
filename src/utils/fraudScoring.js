import { AML_RULES, THREAT_LEVELS } from '../constants/fraudRules';

export function scoreFraud(tx) {
  let score = 0;
  const rulesTriggered = [];
  const indicators = [];

  const amountUsd = tx.valueUsd || 0;
  const sender = (tx.from || '').toLowerCase();
  const receiver = (tx.to || '').toLowerCase();

  // 1. Sanction List Match
  const isSanctioned = AML_RULES.SANCTION_LIST.some(
    (addr) => addr.toLowerCase() === sender || addr.toLowerCase() === receiver
  );
  if (isSanctioned) {
    score += 98;
    rulesTriggered.push('Sanction List Match');
    indicators.push({ type: 'SANCTION', label: 'Sanctioned Entity Address' });
  }

  // 2. Mixer Interaction
  const isMixer = AML_RULES.MIXERS.some(
    (addr) => addr.toLowerCase() === sender || addr.toLowerCase() === receiver
  );
  if (isMixer) {
    score += 92;
    rulesTriggered.push('Mixer Deposit/Withdrawal');
    indicators.push({ type: 'MIXER', label: 'Tornado/Wasabi Interaction' });
  }

  // 3. High Value Transaction
  if (amountUsd >= AML_RULES.CRITICAL_VALUE_USD) {
    score += 85;
    rulesTriggered.push('Critical Volume ($1M+)');
    indicators.push({ type: 'VOLUME', label: 'Mega Whale Movement' });
  } else if (amountUsd >= AML_RULES.HIGH_VALUE_USD) {
    score += 45;
    rulesTriggered.push('High Volume ($250k+)');
    indicators.push({ type: 'VOLUME', label: 'Whale Movement' });
  }

  // 4. Smurfing Pattern (transfers just under the reporting threshold of $10,000)
  if (amountUsd >= AML_RULES.SMURF_MIN_USD && amountUsd <= AML_RULES.SMURF_MAX_USD) {
    score += 65;
    rulesTriggered.push('Structured Transfer (Smurfing)');
    indicators.push({ type: 'PATTERN', label: 'Under-threshold Structuring' });
  }

  // 5. Velocity / Rapid multi-hops (if provided on tx object)
  if (tx.velocityCount && tx.velocityCount > 10) {
    score += 55;
    rulesTriggered.push('High Velocity Activity');
    indicators.push({ type: 'VELOCITY', label: 'Rapid Splitting/Layering' });
  } else if (tx.hopCount && tx.hopCount > 3) {
    score += 30;
    rulesTriggered.push('Multi-hop Routing Chain');
    indicators.push({ type: 'ROUTING', label: 'Complex Layering Chain' });
  }

  // 6. Night-time (Suspicious Hours)
  if (tx.timestamp) {
    const hours = new Date(tx.timestamp).getHours();
    if (hours >= AML_RULES.SUSPICIOUS_HOURS.start && hours <= AML_RULES.SUSPICIOUS_HOURS.end) {
      score += 15;
      rulesTriggered.push('Off-hours Activity');
      indicators.push({ type: 'TIMING', label: 'Suspicious Hours Transfer' });
    }
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Fallback to low if no alerts
  if (score === 0) {
    score = Math.floor(Math.random() * 20) + 5; // default SAFE background noise
  }

  // Map score to Threat Level label
  let threatLevel = 'SAFE';
  if (score >= 96) threatLevel = 'FRAUD NETWORK DETECTED';
  else if (score >= 91) threatLevel = 'ACTIVE LAUNDERING';
  else if (score >= 81) threatLevel = 'CRITICAL';
  else if (score >= 61) threatLevel = 'HIGH RISK';
  else if (score >= 31) threatLevel = 'WATCHLIST';

  // Generate automated AI Reasoning starter
  let aiReasoning = '';
  if (rulesTriggered.length > 0) {
    aiReasoning = `Account ${tx.from ? tx.from.substring(0, 8) : 'Unknown'} exhibits suspicious behavioral characteristics triggering ${rulesTriggered.length} critical security rules. Primary anomaly: ${rulesTriggered.join(', ')}. Transaction routing indicates a high probability of ${threatLevel === 'SAFE' || threatLevel === 'WATCHLIST' ? 'potential staging' : 'active money laundering or evasion tactics'}.`;
  } else {
    aiReasoning = `The transaction routing from ${tx.from ? tx.from.substring(0, 6) : 'origin'} to ${tx.to ? tx.to.substring(0, 6) : 'destination'} is consistent with standard, low-risk operational patterns. No sanction list hits or automated AML anomalies were detected.`;
  }

  return {
    ...tx,
    fraudScore: score,
    threatLevel,
    rulesTriggered,
    behavioralIndicators: indicators,
    aiReasoning
  };
}
