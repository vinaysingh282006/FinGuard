import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  ShieldAlert, CheckCircle, AlertTriangle, ArrowUpRight, 
  Trash2, ShieldCheck, PieChart, Info, Filter, Cpu 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { audioEngine } from '../services/audioEngine';

export default function Alerts() {
  const store = useStore();
  const alerts = store.alerts || [];

  const [filterLevel, setFilterLevel] = useState('ALL');
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [escalatedIds, setEscalatedIds] = useState(new Set());

  const activeAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (resolvedIds.has(a.id)) return false;
      if (filterLevel !== 'ALL' && a.threatLevel !== filterLevel) return false;
      return true;
    });
  }, [alerts, filterLevel, resolvedIds]);

  // Alert pie chart metrics
  const chartData = useMemo(() => {
    const levels = { 'CRITICAL': 0, 'HIGH RISK': 0, 'WARNING': 0, 'WATCHLIST': 0 };
    alerts.forEach(a => {
      if (!resolvedIds.has(a.id)) {
        const level = a.threatLevel || 'WARNING';
        levels[level] = (levels[level] || 0) + 1;
      }
    });
    return Object.entries(levels)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [alerts, resolvedIds]);

  const COLORS = {
    'CRITICAL': '#ff0040',
    'HIGH RISK': '#ff6a00',
    'WARNING': '#f5c400',
    'WATCHLIST': '#00f5ff'
  };

  const handleResolve = (id) => {
    audioEngine.playClick();
    setResolvedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleEscalate = (id) => {
    audioEngine.playWarning();
    setEscalatedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleSARRedirect = (alert) => {
    audioEngine.playClick();
    store.setSelectedTransaction(alert);
    store.setActiveTab('reports');
  };

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Alert Stats Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: 'Active Alerts Queue', val: activeAlerts.length, color: 'var(--risk-critical)', desc: 'Immediate investigation required' },
          { label: 'Escalated Cases', val: escalatedIds.size, color: 'var(--risk-high)', desc: 'Transferred to compliance division' },
          { label: 'Resolved (This Session)', val: resolvedIds.size, color: 'var(--risk-low)', desc: 'Cleared and logged' },
          { label: 'Threat Evasion Vector', val: 'Mixer Obfuscation', color: 'var(--violet-500)', desc: 'Primary detected routing pattern' }
        ].map(({ label, val, color, desc }) => (
          <div key={label} className="glass-card" style={{ padding: 16 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2.5, background: color, boxShadow: `0 0 10px ${color}` }} />
            <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 24, fontFamily: 'Space Grotesk', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'Inter' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Main Console Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        
        {/* Left: Queue Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Filters card */}
          <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                <Filter size={14} className="text-cyan" />
                CRITERIA CONTROL
              </div>
              <button 
                onClick={() => store.setCustomAIPrompt("Perform an executive summary of all active alerts in the console. Identify high risk patterns, velocity scores, and mixer destinations.")}
                className="btn-ghost" 
                style={{ padding: '3px 8px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-violet)', color: 'var(--violet-400)', height: 22, cursor: 'pointer' }}
              >
                <Cpu size={10} /> AI Summary
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'CRITICAL', 'HIGH RISK', 'WARNING'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  style={{
                    fontSize: 10.5, padding: '5px 10px', borderRadius: 6,
                    border: `1px solid ${filterLevel === level ? 'var(--border-cyan)' : 'var(--border-1)'}`,
                    background: filterLevel === level ? 'var(--cyan-dim)' : 'transparent',
                    color: filterLevel === level ? 'var(--cyan-400)' : 'var(--text-3)',
                    cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Active Alerts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeAlerts.length === 0 ? (
              <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 12, borderStyle: 'dashed' }}>
                <ShieldCheck size={28} style={{ color: 'var(--risk-low)', marginBottom: 8, display: 'inline-block' }} />
                <div>Alert Queue is clear. Standard background scanning active.</div>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const isEscalated = escalatedIds.has(alert.id);
                const color = COLORS[alert.threatLevel] || '#fff';
                return (
                  <div 
                    key={alert.id} 
                    className={`glass-card ${alert.threatLevel === 'CRITICAL' ? 'glass-card--critical' : ''}`}
                    style={{ padding: '16px 20px', borderLeft: `4px solid ${color}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge`} style={{ background: `${color}15`, color: color, borderColor: `${color}33`, textShadow: `0 0 6px ${color}33` }}>
                          {alert.threatLevel}
                        </span>
                        {isEscalated && (
                          <span style={{ fontSize: 9.5, padding: '2px 6px', background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.3)', borderRadius: 4, color: 'var(--risk-high)', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                            ESCALATED
                          </span>
                        )}
                        {alert.isSimulated && (
                          <span style={{ fontSize: 9.5, padding: '2px 6px', background: 'rgba(180, 74, 255, 0.15)', border: '1px solid var(--border-violet)', borderRadius: 4, color: 'var(--violet-400)', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                            SIMULATED SCENARIO
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--cyan-400)', fontWeight: 700 }}>
                        {formatCurrency(alert.valueUsd)}
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 12 }}>
                      <strong style={{ color: '#fff' }}>Anomaly:</strong> {alert.reason || 'Flagged transaction detected on network'}<br />
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>
                        Route: {alert.from.substring(0, 15)}... → {alert.to.substring(0, 15)}...
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button 
                        className="btn-ghost" 
                        style={{ fontSize: 11, padding: '5px 10px', color: 'var(--risk-low)' }}
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle size={12} /> RESOLVE
                      </button>
                      <button 
                        className="btn-ghost" 
                        style={{ fontSize: 11, padding: '5px 10px', color: 'var(--risk-high)' }}
                        onClick={() => handleEscalate(alert.id)}
                        disabled={isEscalated}
                      >
                        <AlertTriangle size={12} /> ESCALATE
                      </button>
                      <button 
                        className="btn-ghost" 
                        style={{ fontSize: 11, padding: '5px 10px', color: 'var(--violet-400)' }}
                        onClick={() => handleSARRedirect(alert)}
                      >
                        <ArrowUpRight size={12} /> COMPLIANCE SAR
                      </button>
                      <button 
                        className="btn-ghost" 
                        style={{ fontSize: 11, padding: '5px 10px', color: 'var(--cyan-400)', borderColor: 'var(--border-cyan)' }}
                        onClick={() => {
                          store.setSelectedTransaction(alert);
                          store.setCustomAIPrompt(`Examine this security alert in detail. Urgency: ${alert.threatLevel}, Reason: ${alert.reason}, Value: $${alert.valueUsd.toLocaleString()}. Explain historical correlation with laundering and laundering paths.`);
                        }}
                      >
                        <Cpu size={12} /> AI EXPLAIN
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right: Pie Chart Breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Chart Panel */}
          <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <PieChart size={14} className="text-cyan" />
              Risk Level Distribution
            </div>
            
            {chartData.length > 0 ? (
              <div style={{ height: 160, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#fff'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'rgba(5, 8, 18, 0.95)', border: '1px solid var(--border-cyan)', borderRadius: 8, fontSize: 11 }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 18, fontFamily: 'Space Grotesk', fontWeight: 800, color: '#fff' }}>{activeAlerts.length}</span>
                  <span style={{ fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase' }}>Active</span>
                </div>
              </div>
            ) : (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 11 }}>
                No active threats logged.
              </div>
            )}

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, textAlign: 'left', borderTop: '1px solid var(--border-0)', paddingTop: 12 }}>
              {Object.entries(COLORS).map(([lvl, col]) => (
                <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-2)', fontFamily: 'Space Grotesk' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
                  {lvl}
                </div>
              ))}
            </div>
          </div>

          {/* AI Threat Assessment Note */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--violet-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} />
              COGNITIVE DIAGNOSTIC
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
              FinGuard neural layers detect a <strong>84% correlation</strong> between circular wash trading loops and recent transaction velocity spikes on the SOL chain. High risk addresses are being cached in OFAC lookup arrays.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
