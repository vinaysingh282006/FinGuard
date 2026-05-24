import React from 'react';

export default function FraudScoreGauge({ score = 0, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Determine color based on score
  let strokeColor = '#00d68f'; // Safe (emerald)
  let glowColor = 'rgba(0, 214, 143, 0.3)';
  if (score >= 91) {
    strokeColor = '#7c5cfc'; // Active Laundering (purple)
    glowColor = 'rgba(124, 92, 252, 0.4)';
  } else if (score >= 81) {
    strokeColor = '#ff2d55'; // Critical (red)
    glowColor = 'rgba(255, 45, 85, 0.4)';
  } else if (score >= 61) {
    strokeColor = '#ff6a00'; // High Risk (orange)
    glowColor = 'rgba(255, 106, 0, 0.3)';
  } else if (score >= 31) {
    strokeColor = '#33dcf7'; // Watchlist (cyan)
    glowColor = 'rgba(51, 220, 247, 0.3)';
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={strokeWidth}
        />
        {/* Animated colored overlay progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease',
            filter: `drop-shadow(0px 0px 6px ${strokeColor})`
          }}
        />
      </svg>
      {/* Centered Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline-md text-2xl font-bold tracking-tight text-white">{Math.round(score)}</span>
        <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}
