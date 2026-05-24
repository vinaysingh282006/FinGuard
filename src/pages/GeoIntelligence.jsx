import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Globe, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import Globe3D from '../components/shared/Globe3D';

const RISK_REGIONS = [
  { country: 'North Korea', code: 'KP', risk: 98, alerts: 83, color: 'var(--risk-critical)', desc: 'State-sponsored Lazarus laundering campaigns.' },
  { country: 'Russia', code: 'RU', risk: 92, alerts: 47, color: 'var(--risk-critical)', desc: 'Sanctions evasion networks & ransomware payouts.' },
  { country: 'Iran', code: 'IR', risk: 88, alerts: 31, color: 'var(--risk-critical)', desc: 'Underground financial tunnels.' },
  { country: 'Belarus', code: 'BY', risk: 71, alerts: 12, color: 'var(--risk-high)', desc: 'Secondary sanctions containment threat.' },
  { country: 'Myanmar', code: 'MM', risk: 65, alerts: 9, color: 'var(--risk-high)', desc: 'High-density shadow wallet clusters.' },
  { country: 'Venezuela', code: 'VE', risk: 58, alerts: 7, color: 'var(--risk-medium)', desc: 'Government-backed evasion currencies.' },
];

export default function GeoIntelligence() {
  const store = useStore();
  const [chainFilter, setChainFilter] = useState('ALL');

  return (
    <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* Left Sidebar Control Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4 }}>
        
        {/* Controls Card */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--cyan-500)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Globe size={15} />
            Command Settings
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Inter', fontWeight: 600, textTransform: 'uppercase' }}>Active Network Filter</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['ALL', 'BTC', 'ETH', 'SOL'].map(c => (
              <button
                key={c}
                onClick={() => setChainFilter(c)}
                style={{
                  fontSize: 11, padding: '6px 12px', borderRadius: 6,
                  border: `1px solid ${chainFilter === c ? 'var(--border-cyan)' : 'var(--border-1)'}`,
                  background: chainFilter === c ? 'var(--cyan-dim)' : 'rgba(5, 8, 18, 0.4)',
                  color: chainFilter === c ? 'var(--cyan-400)' : 'var(--text-2)',
                  cursor: 'pointer', fontFamily: 'Inter', fontWeight: chainFilter === c ? 700 : 500,
                  boxShadow: chainFilter === c ? 'var(--cyan-glow-sm)' : 'none',
                  transition: 'all 150ms ease'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Global Statistics Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Active Zones', val: '48', color: 'var(--cyan-500)' },
            { label: 'Tactical Pins', val: '10', color: 'var(--risk-high)' },
            { label: 'Flow Curves', val: '9', color: 'var(--violet-500)' },
            { label: 'OFAC Targets', val: '3', color: 'var(--risk-critical)' },
          ].map(({ label, val, color }) => (
            <div key={label} className="glass-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color, textShadow: `0 0 6px ${color}44` }}>{val}</div>
            </div>
          ))}
        </div>

        {/* High-Risk Jurisdictions List */}
        <div className="glass-card" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--risk-critical)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <AlertCircle size={14} />
            Jurisdiction Watchlist
          </div>
          <div className="nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
            {RISK_REGIONS.map(({ country, code, risk, alerts, color, desc }) => (
              <div key={code} style={{ borderBottom: '1px solid var(--border-0)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, fontFamily: 'Inter' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      width: 22, height: 15, 
                      background: `${color}15`, 
                      border: `1px solid ${color}33`, 
                      borderRadius: 3, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 8, 
                      fontFamily: 'JetBrains Mono', 
                      color,
                      fontWeight: 700
                    }}>{code}</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{country}</span>
                  </div>
                  <span style={{ color, fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 11 }}>{risk}% RISK</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${risk}%`, background: color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'Inter', lineHeight: 1.3 }}>{desc}</div>
                <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 3, fontFamily: 'JetBrains Mono' }}>🚨 {alerts} ALERTS LOGGED</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3D Globe Visualization Panel */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'rgba(2,4,10,0.6)' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3D Global Threat Intelligence Globe</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Interactive WebGL coordinate maps detailing cross-border transactions and critical AML evaders.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot status-dot-cyan" />
            <span style={{ fontSize: 11, color: 'var(--cyan-400)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.05em' }}>3D WEBGL ACTIVE</span>
          </div>
        </div>

        {/* Three.js Globe container */}
        <div style={{ flex: 1, background: '#02040a', position: 'relative' }}>
          <Globe3D />
          
          {/* Instructions Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'rgba(5, 8, 18, 0.75)',
            border: '1px solid var(--border-1)',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'Inter',
            fontSize: 10,
            color: 'var(--text-2)',
            pointerEvents: 'none'
          }}>
            🖱️ Left Click + Drag to rotate | Scroll to zoom | Right Click + Drag to pan
          </div>
        </div>
      </div>
    </div>
  );
}
