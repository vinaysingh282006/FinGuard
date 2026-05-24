import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  BarChart2, TrendingUp, Cpu, Activity, Zap, 
  HelpCircle, Compass, ShieldCheck 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, LineChart, Line 
} from 'recharts';

// Speedometer component for Fear & Greed Index
function FearAndGreedGauge({ index = 68 }) {
  let label = 'GREED';
  let color = 'var(--cyan-400)';
  if (index >= 75) {
    label = 'EXTREME GREED';
    color = 'var(--emerald-500)';
  } else if (index < 45) {
    label = 'FEAR';
    color = 'var(--risk-high)';
  } else if (index < 25) {
    label = 'EXTREME FEAR';
    color = 'var(--risk-critical)';
  }

  // Calculate needle angle
  // 0 is extreme fear (-90 deg), 100 is extreme greed (+90 deg)
  const angle = (index / 100) * 180 - 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 180, height: 100, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Arc */}
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Base Background Track */}
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
          
          {/* Active colored path */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke={color} 
            strokeWidth="8" 
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (index / 100) * 125.6}
            style={{ transition: 'stroke-dashoffset 800ms ease', filter: `drop-shadow(0 0 6px ${color}aa)` }}
          />

          {/* Needle Pin Center */}
          <circle cx="50" cy="50" r="3" fill="#fff" />
          {/* Needle Line */}
          <line 
            x1="50" y1="50" x2="50" y2="15" 
            stroke="#fff" strokeWidth="2.5" 
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
            style={{ transformOrigin: '50px 50px', transition: 'transform 800ms cubic-bezier(0.25, 0.8, 0.25, 1)' }}
          />
        </svg>
        
        {/* Value tag */}
        <div style={{ position: 'absolute', bottom: 0, textAlign: 'center' }}>
          <span style={{ fontSize: 24, fontFamily: 'Space Grotesk', fontWeight: 800, color: '#fff' }}>{index}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 700, color, textShadow: `0 0 8px ${color}55` }}>{label}</div>
        <div style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>Sentimental Index</div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const store = useStore();
  const prices = store.prices || {};

  // Mock Price trend trajectories
  const priceData = useMemo(() => {
    const data = [];
    const btcBase = prices.BTC || 98200;
    const ethBase = prices.ETH || 3120;
    for (let i = 24; i >= 0; i--) {
      data.push({
        time: `${i}h ago`,
        BTC: Math.round(btcBase * (1.0 + Math.sin(i * 0.4) * 0.015 - (i * 0.0006))),
        ETH: Math.round(ethBase * (1.0 + Math.sin(i * 0.3) * 0.012 + (i * 0.0004))),
        gas: Math.round(15 + Math.sin(i * 0.5) * 8 + (Math.random() * 3))
      });
    }
    return data;
  }, [prices]);

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* HUD Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: 'BTC Trend Rate', val: `$${(prices.BTC || 98200).toLocaleString()}`, color: '#F7931A', desc: '▲ 2.4% volatility' },
          { label: 'ETH Gas Congestion', val: '12 GWEI', color: 'var(--emerald-500)', desc: 'Network load nominal' },
          { label: 'Total Scanned Ledger', val: (store.transactions.length * 401).toLocaleString(), color: 'var(--cyan-500)', desc: 'Continuous index monitoring' },
          { label: 'Active Sanction Vectors', val: '5 coordinates', color: 'var(--risk-critical)', desc: 'OFAC matching enabled' }
        ].map(({ label, val, color, desc }) => (
          <div key={label} className="glass-card" style={{ padding: 16 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2.5, background: color, boxShadow: `0 0 10px ${color}` }} />
            <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 22, fontFamily: 'Space Grotesk', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'Inter' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        
        {/* Left: Charts queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* BTC/ETH Trajectories Area Chart */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} className="text-cyan" />
                Asset Valuation Indexes (24H Trace)
              </div>
              <span className="text-[10px] text-text-3 font-mono">Live CG Feed updates</span>
            </div>

            <div style={{ height: 210, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="btcArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F7931A" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#F7931A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ethArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#627EEA" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#627EEA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.01)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-3)" tickLine={false} style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="var(--text-3)" tickLine={false} domain={['auto', 'auto']} style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(5, 8, 18, 0.95)', border: '1px solid var(--border-cyan)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--cyan-400)', fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700 }}
                    itemStyle={{ color: '#fff', fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="BTC" stroke="#F7931A" strokeWidth={2} fillOpacity={1} fill="url(#btcArea)" name="Bitcoin Price" />
                  <Area type="monotone" dataKey="ETH" stroke="#627EEA" strokeWidth={2} fillOpacity={1} fill="url(#ethArea)" name="Ethereum Price" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gas Fee Volatility Line Chart */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} className="text-emerald" />
                Congestion Volatility (GWEI Gas load)
              </div>
              <span className="text-[10px] text-text-3 font-mono">Etherscan Webhook</span>
            </div>

            <div style={{ height: 150, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.01)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-3)" tickLine={false} style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="var(--text-3)" tickLine={false} style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(5, 8, 18, 0.95)', border: '1px solid var(--border-cyan)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--cyan-400)', fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700 }}
                    itemStyle={{ color: '#fff', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="gas" stroke="var(--emerald-500)" strokeWidth={1.5} dot={false} name="Gas Fee" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right: Sentimental gauges & logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Sentiment Gauge */}
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, alignSelf: 'flex-start' }}>
              Market Sentiment index
            </div>
            <FearAndGreedGauge index={64} />
          </div>

          {/* AI Volatility analysis */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12.5, color: 'var(--violet-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} />
              CONGESTION DIAGNOSTIC
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4, fontFamily: 'Inter' }}>
              Current Ethereum gas index remains locked below 15 GWEI. Historical correlation models predict an impending liquidity surge of <strong>$450M</strong> into stablecoin routing pools, increasing potential velocity alerts. Standard transaction filters are active.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
