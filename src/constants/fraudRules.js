export const AML_RULES = {
  SANCTION_LIST: [
    '0x7F1dD3A1B2C8d8B5c7E9fA0b1c9F7A2c3B4C5D6E',
    '0x3C8a82d1C792Eef0C801456B48B57d2a588b394A',
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
    'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  ],
  MIXERS: [
    '0x905Ab8EBFED5d11A13C25D414e251DaFE3b00C6B', // Tornado.Cash
    '0x12D66eD488E1102A176B8e2E06BEbfCA1C18Dbd7', // Tornado Router
    'bc1q mixer address wasabi',
    'tc1q tornado address btc'
  ],
  REPORTING_THRESHOLD_USD: 10000,
  SMURF_MIN_USD: 9000,
  SMURF_MAX_USD: 9999,
  HIGH_VALUE_USD: 250000,
  CRITICAL_VALUE_USD: 1000000,
  SUSPICIOUS_HOURS: { start: 2, end: 5 } // 2 AM to 5 AM
};

export const THREAT_LEVELS = {
  SAFE: {
    label: 'SAFE',
    minScore: 0,
    maxScore: 30,
    color: '#00d68f',
    bg: 'rgba(0, 214, 143, 0.1)',
    border: 'rgba(0, 214, 143, 0.3)',
    description: 'Normal transaction activity with verified routing.'
  },
  WATCHLIST: {
    label: 'WATCHLIST',
    minScore: 31,
    maxScore: 60,
    color: '#33dcf7',
    bg: 'rgba(51, 220, 247, 0.1)',
    border: 'rgba(51, 220, 247, 0.3)',
    description: 'Minor anomaly detected, flagged for surveillance.'
  },
  HIGH_RISK: {
    label: 'HIGH RISK',
    minScore: 61,
    maxScore: 80,
    color: '#ff6a00',
    bg: 'rgba(255, 106, 0, 0.1)',
    border: 'rgba(255, 106, 0, 0.3)',
    description: 'Significant anomaly or structured flow detected.'
  },
  CRITICAL: {
    label: 'CRITICAL',
    minScore: 81,
    maxScore: 90,
    color: '#ff2d55',
    bg: 'rgba(255, 45, 85, 0.1)',
    border: 'rgba(255, 45, 85, 0.3)',
    description: 'High confidence risk. Association with suspected illicit activity.'
  },
  ACTIVE_LAUNDERING: {
    label: 'ACTIVE LAUNDERING',
    minScore: 91,
    maxScore: 95,
    color: '#7c5cfc',
    bg: 'rgba(124, 92, 252, 0.1)',
    border: 'rgba(124, 92, 252, 0.3)',
    description: 'Active layering, rapid structural splitting, or mixer interaction.'
  },
  FRAUD_NETWORK: {
    label: 'FRAUD NETWORK DETECTED',
    minScore: 96,
    maxScore: 100,
    color: '#ff4d4d',
    bg: 'rgba(255, 77, 77, 0.1)',
    border: 'rgba(255, 77, 77, 0.3)',
    description: 'Direct association with sanctioned entity or known exploit group.'
  }
};
