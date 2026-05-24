import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Activity, ShieldAlert, Zap, GitBranch, TrendingUp, 
  TrendingDown, Play, Square, RefreshCw, Cpu, Radio, Shield 
} from 'lucide-react';
import KPICards from '../components/dashboard/KPICards';
import { startDemoSequence, stopDemoSequence } from '../utils/demoMode';
import { formatCurrency, formatDate } from '../utils/formatters';

function RiskBadge({ level }) {
  const map = {
    'SAFE':                    'badge-low',
    'LOW':                     'badge-low',
    'WATCHLIST':               'badge-medium',
    'MEDIUM':                  'badge-medium',
    'HIGH RISK':               'badge-high',
    'HIGH':                    'badge-high',
    'CRITICAL':                'badge-critical',
    'ACTIVE LAUNDERING':       'badge-critical',
    'FRAUD NETWORK DETECTED':  'badge-critical',
  };
  const cls = map[(level || '').toUpperCase().replace(/ /g, '_')] || 'badge-low';
  const labels = { 
    'badge-low': 'Safe', 
    'badge-medium': 'Watchlist', 
    'badge-high': 'High Risk', 
    'badge-critical': 'Critical' 
  };
  const label = labels[cls] || level || 'Safe';
  return (
    <span className={`badge ${cls}`}>
      {cls === 'badge-critical' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'badge-pulse 2s infinite' }} />
      )}
      {label}
    </span>
  );
}



// Custom animated 3D-like Financial Threat Index (FTI) circular gauge
function FtiGauge({ index }) {
  // Determine color matching index
  let color = 'var(--emerald-500)';
  let classification = 'SAFE';
  if (index >= 91) {
    color = 'var(--violet-500)';
    classification = 'ACTIVE LAUNDERING';
  } else if (index >= 81) {
    color = 'var(--risk-critical)';
    classification = 'CRITICAL';
  } else if (index >= 61) {
    color = 'var(--risk-high)';
    classification = 'HIGH RISK';
  } else if (index >= 31) {
    color = 'var(--cyan-500)';
    classification = 'WATCHLIST';
  }

  const radius = 34;
  const strokeDash = 2 * Math.PI * radius;
  const offset = strokeDash - (index / 100) * strokeDash;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {/* Animated Circular Gauge */}
      <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
        <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {/* Base outer circle */}
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
          
          {/* Progress circle */}
          <circle 
            cx="40" 
            cy="40" 
            r={radius} 
            fill="none" 
            stroke={color} 
            strokeWidth="6"
            strokeDasharray={strokeDash}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.25, 0.8, 0.25, 1), stroke 800ms ease',
              filter: `drop-shadow(0 0 6px ${color}aa)`
            }} 
          />
          
          {/* Decorative outer ticks */}
          <circle cx="40" cy="40" r="39" fill="none" stroke="rgba(0,245,255,0.03)" strokeWidth="1" strokeDasharray="3,6" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 18, color: '#fff', textShadow: `0 0 6px ${color}55` }}>{index}</span>
          <span style={{ fontSize: 7.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>FTI SCORE</span>
        </div>
      </div>

      {/* Info details */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9.5, fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.08em' }}>System Status</div>
        <div style={{ fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 800, color, textShadow: `0 0 8px ${color}33`, marginTop: 2 }}>{classification}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.3, fontFamily: 'Inter' }}>
          {index >= 81 ? 'Emergency protocols enabled. Multiple laundering routes identified in current transaction pipeline.' : 
           index >= 61 ? 'Evasion filters active. Watching splitting and structure vectors.' : 
           'Flow signature normal. Standard background surveillance noise.'}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const store = useStore();
  const stats = store.stats || {};
  const recentTxs = (store.transactions || []).slice(0, 7);
  const threatIndex = stats.threatIndex || 42;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* KPI HUD Grid */}
      <KPICards />

      {/* Main Command Console Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        
        {/* LEFT: Timelines & Simulation Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Threat Evasion Scenario Simulator */}
          <div className="glass-card animate-fade-up" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(180,74,255,0.08)', border: '1px solid var(--border-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={16} className="text-violet animate-pulse" />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Evasion Attack Simulator</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>Inject simulated multi-stage laundering cascades to test neural models.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                className="btn-ghost"
                style={{ padding: '6px 12px', fontSize: 11, borderColor: 'var(--border-violet)', color: 'var(--violet-400)', height: 32 }}
                onClick={() => store.setCustomAIPrompt("Explain the current multi-stage laundering cascade simulation. What patterns are being injected?")}
              >
                <Cpu size={11} /> AI Explain
              </button>
              <button
                className={store.demoActive ? 'btn-ghost' : 'btn-primary'}
                style={store.demoActive ? { borderColor: 'var(--risk-critical)', color: 'var(--risk-critical)', height: 32 } : { height: 32 }}
                onClick={() => store.demoActive ? stopDemoSequence(store) : startDemoSequence(store)}
              >
                {store.demoActive ? (
                  <>
                    <Square size={11} fill="currentColor" />
                    <span>HALT</span>
                  </>
                ) : (
                  <>
                    <Play size={11} fill="currentColor" />
                    <span>SIMULATE</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Mempool feed */}
          <div className="glass-card animate-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2,4,10,0.6)' }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TACTICAL MEMPOOL FEED</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Ethereum & Bitcoin transaction ingress.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot status-dot-green" />
                <span style={{ fontSize: 10.5, color: 'var(--risk-low)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE STREAMING</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: 310 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Hash ID</th>
                    <th>Value USD</th>
                    <th>FTI Index</th>
                    <th>Heuristics</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentTxs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 12, fontFamily: 'Inter' }}>
                        No transactions ingested yet. Click DEMO above or wait for WS nodes.
                      </td>
                    </tr>
                  ) : (
                    recentTxs.map((tx, idx) => {
                      const isCritical = tx.fraudScore >= 81;
                      const isHigh = tx.fraudScore >= 61 && !isCritical;
                      return (
                        <tr
                          key={tx.hash || idx}
                          className={isCritical ? 'row-critical' : isHigh ? 'row-high' : ''}
                          onClick={() => store.setSelectedTransaction(tx)}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: tx.chain === 'BTC' ? '#F7931A' : tx.chain === 'ETH' ? '#627EEA' : '#00FFA3',
                                boxShadow: `0 0 4px ${tx.chain === 'BTC' ? '#F7931A' : tx.chain === 'ETH' ? '#627EEA' : '#00FFA3'}`
                              }} />
                              <span style={{ fontFamily: 'Space Grotesk', fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)' }}>{tx.chain}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="address-chip">{(tx.hash || '').substring(0, 12)}...</span>
                              {tx.isSimulated && (
                                <span style={{ fontSize: 8.5, background: 'rgba(180, 74, 255, 0.15)', border: '1px solid var(--border-violet)', color: 'var(--violet-400)', padding: '1px 4px', borderRadius: 3, fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                                  SIMULATED
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--cyan-400)', fontWeight: 700 }}>
                              {formatCurrency(tx.valueUsd)}
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                              fontFamily: 'JetBrains Mono', 
                              fontWeight: 700, 
                              color: isCritical ? 'var(--risk-critical)' : isHigh ? 'var(--risk-high)' : 'var(--risk-low)'
                            }}>{tx.fraudScore}</span>
                          </td>
                          <td><RiskBadge level={tx.threatLevel} /></td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: 'var(--cyan-500)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                              INSPECT →
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: FTI GAUGE + INTEL TARGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* FTI Score circular panel */}
          <div className="glass-card animate-fade-up-delay-1" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Composite Threat Matrix
              </div>
              <button 
                onClick={() => store.setCustomAIPrompt(`Analyze the active Threat Index of ${threatIndex}/100. What is causing this threat level, and what are the recommended AML actions?`)}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: 10, borderColor: 'var(--border-violet)', color: 'var(--violet-400)', height: 24 }}
              >
                <Cpu size={10} /> Forecast Risk
              </button>
            </div>
            <FtiGauge index={threatIndex} />
          </div>

          {/* Tactical Target watchlists */}
          <div className="glass-card animate-fade-up-delay-2" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evasion Watchlist</div>
              <button 
                onClick={() => store.setCustomAIPrompt("Perform an analysis of the active addresses on the Evasion Watchlist. Detail their potential involvement in mixers or sanction violations.")}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: 10, borderColor: 'var(--border-cyan)', color: 'var(--cyan-400)', height: 24 }}
              >
                <Cpu size={10} /> Scan List
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Binance Hot Wallet', addr: '0x28C6...E66C', val: '$1.2B', status: 'SECURE', color: 'var(--cyan-500)' },
                { name: 'Lazarus Exploit Node', addr: '0x7F1d...D6E', val: '$42.8M', status: 'FLAGGED', color: 'var(--risk-critical)' },
                { name: 'Whale Evasion Cluster', addr: '0xAb58...2F45', val: '$285.1M', status: 'DORMANT', color: 'var(--text-3)' },
              ].map(({ name, addr, val, status, color }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid transparent', cursor: 'pointer', transition: 'all 200ms ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 245, 255, 0.02)'; e.currentTarget.style.borderColor = 'var(--border-1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; }}
                  onClick={() => store.setSelectedAddress(addr)}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldAlert size={15} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{addr}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{val}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-3)', marginTop: 2, fontFamily: 'Space Grotesk', fontWeight: 700 }}>{status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive Diagnostic load */}
          <div className="glass-card animate-fade-up-delay-3" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Cognitive Engine</div>
            {[
              { label: 'Neural Inference Lag', val: '12.4ms', pct: 15, color: 'var(--cyan-500)' },
              { label: 'Cognitive IOPS load', val: '421,092', pct: 65, color: 'var(--emerald-500)' },
              { label: 'Gemini Session token usage', val: '8.4 / 32k', pct: 26, color: 'var(--violet-500)' },
            ].map(({ label, val, pct, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, fontFamily: 'Inter' }}>
                  <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ color, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{val}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
