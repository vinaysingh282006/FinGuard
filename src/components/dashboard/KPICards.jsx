import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Activity, ShieldAlert, Zap, GitBranch } from 'lucide-react';

function CountUp({ end, duration = 800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const startVal = end * 0.92;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(startVal + (end - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else setVal(end);
    };
    requestAnimationFrame(tick);
  }, [end]);
  return <>{val.toLocaleString()}</>;
}

function KpiCard({ label, value, Icon, trend, trendUp, delay, color }) {
  return (
    <div className={`glass-card kpi-card animate-fade-up-delay-${delay}`}
         style={{ flex: 1, minWidth: 220, position: 'relative', overflow: 'hidden', padding: 18 }}>
      {/* Laser line effect */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0, width: 2.5,
        background: color,
        boxShadow: `0 0 12px ${color}`
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
          {label}
        </span>
        <Icon size={16} style={{ color, opacity: 0.8, filter: `drop-shadow(0 0 4px ${color}66)` }} />
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 26, color: 'var(--text-1)', lineHeight: 1, marginBottom: 8 }}>
        <CountUp end={value} />
      </div>
      <div style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono', color: trendUp ? 'var(--risk-low)' : 'var(--risk-critical)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
        {trendUp ? '▲' : '▼'} {trend}
      </div>
    </div>
  );
}

export default function KPICards() {
  const store = useStore();
  const stats = store.stats || {};

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', width: '100%' }}>
      <KpiCard 
        label="Transactions Drained" 
        value={stats.totalMonitored || 0} 
        Icon={Activity} 
        trend="Real-time WS polling active" 
        trendUp={true} 
        delay={1} 
        color="var(--cyan-500)" 
      />
      <KpiCard 
        label="Threat Triggers" 
        value={stats.amlFlagsCount || 0} 
        Icon={ShieldAlert} 
        trend={`${store.alerts.length} unresolved cases`} 
        trendUp={false} 
        delay={2} 
        color="var(--risk-critical)" 
      />
      <KpiCard 
        label="Whale Transits" 
        value={stats.whaleMovementsCount || 0} 
        Icon={Zap} 
        trend="Volume thresholds > $1M" 
        trendUp={true} 
        delay={3} 
        color="var(--violet-500)" 
      />
      <KpiCard 
        label="FTI Alerts Logged" 
        value={store.alerts.length || 0} 
        Icon={GitBranch} 
        trend="Automated SAR reporting ready" 
        trendUp={false} 
        delay={4} 
        color="var(--risk-high)" 
      />
    </div>
  );
}
