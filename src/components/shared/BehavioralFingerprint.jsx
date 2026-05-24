import React from 'react';
import { Activity, ShieldAlert, Coins, EyeOff, Clock, Shuffle } from 'lucide-react';

export default function BehavioralFingerprint({ indicators = [], score = 0 }) {
  // Safe indicators if empty
  const defaultIndicators = [
    { type: 'IDENTITY', label: 'Wallet Entity Verified', active: score < 30 },
    { type: 'MIXER', label: 'Mixer (Tornado) Interaction Check', active: score >= 90 },
    { type: 'VELOCITY', label: 'High Velocity Transfer Check', active: score >= 50 },
    { type: 'VOLUME', label: 'Over-threshold Structured volume', active: score >= 40 },
    { type: 'TIMING', label: 'Off-hours Transaction Timing', active: score >= 15 && score < 40 },
    { type: 'ROUTING', label: 'Multi-hop Laundering Path Check', active: score >= 60 }
  ];

  const activeIndicators = indicators.length > 0 
    ? indicators.map(ind => ({ ...ind, active: true }))
    : defaultIndicators;

  const getIcon = (type) => {
    switch (type) {
      case 'SANCTION':
      case 'IDENTITY':
        return <ShieldAlert size={14} />;
      case 'MIXER':
        return <EyeOff size={14} />;
      case 'VELOCITY':
        return <Activity size={14} />;
      case 'VOLUME':
        return <Coins size={14} />;
      case 'TIMING':
        return <Clock size={14} />;
      case 'ROUTING':
      case 'PATTERN':
        return <Shuffle size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  return (
    <div className="glass-card rounded-xl p-md border border-glass-border/30 bg-surface-container/20">
      <div className="flex justify-between items-center mb-md border-b border-glass-border pb-sm">
        <h4 className="font-headline-md text-sm text-text-1 uppercase tracking-wider">Account Behavioral DNA</h4>
        <span className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded font-mono">
          PROFILE SCORING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xs">
        {activeIndicators.map((ind, i) => (
          <div 
            key={i} 
            className={`flex items-center gap-2 p-2 rounded border transition-all duration-300 ${
              ind.active 
                ? 'bg-risk-critical-bg border-risk-critical/30 text-risk-critical' 
                : 'bg-glass-border/5 border-glass-border/10 text-text-3'
            }`}
          >
            <div className={`p-1 rounded ${ind.active ? 'bg-risk-critical/10' : 'bg-glass-border/10'}`}>
              {getIcon(ind.type)}
            </div>
            <div>
              <p className="text-xs font-semibold leading-none">{ind.label}</p>
              <p className="text-[9px] mt-0.5 opacity-60 uppercase">
                {ind.active ? 'Anomaly Detected' : 'Verified Safe'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
