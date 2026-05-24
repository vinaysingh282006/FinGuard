import React from 'react';
import { THREAT_LEVELS } from '../../constants/fraudRules';

export default function RiskBadge({ level }) {
  // Normalize key
  const key = (level || 'SAFE').toUpperCase().replace(/ /g, '_');
  const levelInfo = THREAT_LEVELS[key] || THREAT_LEVELS.SAFE;

  // Pulsing animation style for high-threat classifications
  const isHighRisk = ['CRITICAL', 'ACTIVE LAUNDERING', 'FRAUD NETWORK DETECTED'].includes(levelInfo.label);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-semibold tracking-wider uppercase transition-all duration-300"
      style={{
        backgroundColor: levelInfo.bg,
        borderColor: levelInfo.border,
        color: levelInfo.color,
        boxShadow: isHighRisk ? `0 0 10px ${levelInfo.border}` : 'none',
      }}
    >
      {isHighRisk && (
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: levelInfo.color }}
          ></span>
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: levelInfo.color }}
          ></span>
        </span>
      )}
      {levelInfo.label}
    </span>
  );
}
