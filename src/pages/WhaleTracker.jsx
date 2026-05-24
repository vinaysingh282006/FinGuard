import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Zap, ShieldAlert, ArrowRight, TrendingUp, DollarSign, 
  GitBranch, HelpCircle, RefreshCw, Cpu, Layers, AlertCircle 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { audioEngine } from '../services/audioEngine';

export default function WhaleTracker() {
  const store = useStore();
  const whaleAlerts = store.whaleAlerts || [];
  const [selectedWhale, setSelectedWhale] = useState(null);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Stats
  const totalVolume = useMemo(() => {
    return whaleAlerts.reduce((acc, curr) => acc + (curr.valueUsd || 0), 0);
  }, [whaleAlerts]);

  const maxTransfer = useMemo(() => {
    if (whaleAlerts.length === 0) return 0;
    return Math.max(...whaleAlerts.map(w => w.valueUsd || 0));
  }, [whaleAlerts]);

  // Chart data (Group by chain)
  const chartData = useMemo(() => {
    const dataMap = { BTC: 0, ETH: 0, SOL: 0, USDT: 0 };
    whaleAlerts.forEach(w => {
      if (dataMap[w.chain] !== undefined) {
        dataMap[w.chain] += w.valueUsd;
      }
    });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
  }, [whaleAlerts]);

  const triggerAIAnalysis = async (w) => {
    setAiLoading(true);
    setAiReport('');
    audioEngine.playWarning();

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const systemPrompt = `You are a military-grade financial threat intelligence bot. 
Analyze this high-volume crypto transaction:
- Chain: ${w.chain}
- TxID: ${w.hash}
- USD Value: ${formatCurrency(w.valueUsd)}
- From: ${w.from}
- To: ${w.to}
- Timestamp: ${w.timestamp}

Provide a concise, ultra-futuristic cyber threat narrative explaining if this represents layering, exchange dump, wallet splitting, or standard cold storage migration. Use terms like 'smurfing', 'layering chains', 'OTC liquidation', and 'OFAC indicators'. Keep it under 150 words.`;

    if (apiKey && apiKey !== 'your_github_secret_gemini_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const responseText = await result.response.text();
        setAiReport(responseText);
        setAiLoading(false);
        return;
      } catch (error) {
        console.error('Gemini API failed in WhaleTracker, fallback to simulation', error);
      }
    }

    // Fallback simulation
    const simulatedText = `[AI INTEL SCAN ACTIVE]
COGNITIVE REPORT: Whale Movement Detected.
- SEVERITY: ${w.valueUsd > 3000000 ? 'CRITICAL RISK (LEVEL 4)' : 'HIGH THREAT PROFILE'}
- PATTERN: Large-value asset split signature detected.

ANALYSIS:
Origin wallet ${w.from} initiated a ${formatCurrency(w.valueUsd)} dispatch. The transaction profile aligns with a layering cash-out sequence:
1. Multi-path splitting is active across 12 newly deployed nodes.
2. An abnormal velocity has been logged on the chain.
3. Destination hubs point to OTC deposit nodes in high-risk zones.

RECOMMENDATION: Flag downstream addresses for automated isolation. Activate compliance triggers.`;

    let index = 0;
    const timer = setInterval(() => {
      setAiReport((prev) => prev + simulatedText[index]);
      index++;
      if (index >= simulatedText.length - 1) {
        clearInterval(timer);
        setAiLoading(false);
      }
    }, 6);
  };

  const selectWhale = (w) => {
    setSelectedWhale(w);
    triggerAIAnalysis(w);
  };

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* HUD metrics at the top */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Whale Vol (Session)', val: formatCurrency(totalVolume || 84200000), color: 'var(--cyan-500)', icon: DollarSign },
          { label: 'Whale Alerts Logged', val: whaleAlerts.length || 12, color: 'var(--violet-500)', icon: ShieldAlert },
          { label: 'Max Transit Value', val: formatCurrency(maxTransfer || 14200000), color: 'var(--risk-critical)', icon: Zap },
          { label: 'Target Entities Identified', val: new Set(whaleAlerts.map(w => w.from)).size || 4, color: 'var(--risk-high)', icon: GitBranch }
        ].map(({ label, val, color, icon: Icon }, idx) => (
          <div key={label} className="glass-card" style={{ padding: 16 }}>
            {/* laser border */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <Icon size={14} style={{ color, opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: 20, fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--text-1)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16, alignItems: 'start' }}>
        
        {/* Left column: Feed list & Recharts volume chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Recharts chart */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              Whale Asset Volume Dispersion
            </div>
            <div style={{ height: 160, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="var(--text-3)" tickLine={false} style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="var(--text-3)" tickLine={false} style={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `$${v/1000000}M`} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(5, 8, 18, 0.95)', border: '1px solid var(--border-cyan)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--cyan-400)', fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700 }}
                    itemStyle={{ color: '#fff', fontSize: 11 }}
                    formatter={(v) => formatCurrency(v)}
                  />
                  <Bar dataKey="value" fill="url(#whaleGrad)" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {/* Gradient color */}
                    <defs>
                      <linearGradient id="whaleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cyan-500)" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="var(--violet-500)" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Whale Feed Table */}
          <div className="glass-card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>LIVE WHALE TRANSIT LOG</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Real-time monitoring of transfers exceeding $1M equivalent.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot status-dot-violet" />
                <span style={{ fontSize: 10, color: 'var(--violet-400)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>WHALE DECODER ACTIVE</span>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto', maxHeight: 380 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Source Wallet</th>
                    <th>Destination Node</th>
                    <th>USD Value</th>
                    <th>Threat level</th>
                    <th>Age</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {whaleAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 11.5 }}>
                        Awaiting massive transit events. Launch demo sequence on dashboard to populate.
                      </td>
                    </tr>
                  ) : (
                    whaleAlerts.map((w, idx) => {
                      const age = Math.round((Date.now() - new Date(w.timestamp).getTime()) / 1000);
                      const ageStr = age < 60 ? `${age}s ago` : `${Math.floor(age/60)}m ago`;
                      return (
                        <tr
                          key={w.id || idx}
                          onClick={() => selectWhale(w)}
                          style={{
                            borderLeft: selectedWhale?.id === w.id ? '3px solid var(--cyan-400)' : '3px solid transparent',
                            background: selectedWhale?.id === w.id ? 'var(--cyan-dim)' : 'transparent'
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: w.chain === 'BTC' ? '#F7931A' : w.chain === 'ETH' ? '#627EEA' : '#00FFA3',
                              }} />
                              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{w.chain}</span>
                            </div>
                          </td>
                          <td><span className="address-chip">{w.from.substring(0, 15)}...</span></td>
                          <td><span className="address-chip">{w.to.substring(0, 15)}...</span></td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--cyan-400)', fontWeight: 700 }}>
                              {formatCurrency(w.valueUsd)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${w.valueUsd > 3000000 ? 'badge-critical' : 'badge-high'}`}>
                              {w.threatLevel}
                            </span>
                          </td>
                          <td><span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>{ageStr}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: 'var(--cyan-500)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>DECIPHER →</span>
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

        {/* Right column: Wallet Splitting Graph / AI Forensics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* visual Wallet Splitting Flow Diagram */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} className="text-cyan" />
                Wallet Splitting Cascade
              </div>
              <span className="text-[10px] text-text-3 font-mono">FLOW LEVEL: 3</span>
            </div>

            {selectedWhale ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', background: 'rgba(2,4,10,0.5)', border: '1px solid var(--border-0)', borderRadius: 10, padding: '24px 10px' }}>
                
                {/* Source Node */}
                <div style={{
                  background: 'rgba(5, 8, 18, 0.9)',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  textAlign: 'center',
                  boxShadow: 'var(--cyan-glow-sm)',
                  width: 180,
                  zIndex: 5
                }}>
                  <div style={{ fontSize: 8.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>WHALE HOLDINGS (ORIGIN)</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {selectedWhale.from}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--cyan-400)', fontWeight: 700, marginTop: 4 }}>
                    {formatCurrency(selectedWhale.valueUsd)}
                  </div>
                </div>

                {/* Splitting Vectors SVG */}
                <div style={{ position: 'relative', width: '100%', height: 60 }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                    {/* Draw splitting connecting paths */}
                    <path d="M 195 0 L 60 60" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="3,3" />
                    <path d="M 195 0 L 195 60" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="3,3" />
                    <path d="M 195 0 L 330 60" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="3,3" />
                  </svg>
                  {/* Glowing flowing beam dots */}
                  <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan-500)', boxShadow: 'var(--cyan-glow-sm)', animation: 'split-flow-left 2s infinite linear' }} />
                  <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan-500)', boxShadow: 'var(--cyan-glow-sm)', animation: 'split-flow-mid 2s infinite linear' }} />
                  <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan-500)', boxShadow: 'var(--cyan-glow-sm)', animation: 'split-flow-right 2s infinite linear' }} />
                </div>

                {/* Intermediate Split wallets */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 6 }}>
                  {[
                    { label: 'Layer Node 1', val: selectedWhale.valueUsd * 0.4 },
                    { label: 'Layer Node 2', val: selectedWhale.valueUsd * 0.35 },
                    { label: 'Layer Node 3', val: selectedWhale.valueUsd * 0.25 }
                  ].map((node, i) => (
                    <div key={i} style={{
                      background: 'rgba(5, 8, 18, 0.8)',
                      border: '1px solid var(--border-violet)',
                      borderRadius: 8,
                      padding: '6px 8px',
                      textAlign: 'center',
                      flex: 1,
                      minWidth: 0,
                      boxShadow: 'var(--violet-glow)'
                    }}>
                      <div style={{ fontSize: 8, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>{node.label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, color: '#fff', fontWeight: 700, marginTop: 2 }}>
                        {formatCurrency(node.val)}
                      </div>
                      <div style={{ fontSize: 7.5, color: 'var(--risk-high)', marginTop: 2 }}>Velocity Tag: High</div>
                    </div>
                  ))}
                </div>

                {/* Sub SVG links */}
                <div style={{ position: 'relative', width: '100%', height: 40 }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                    <path d="M 60 0 L 195 40" stroke="var(--border-0)" strokeWidth="1" />
                    <path d="M 195 0 L 195 40" stroke="var(--border-0)" strokeWidth="1" />
                    <path d="M 330 0 L 195 40" stroke="var(--border-0)" strokeWidth="1" />
                  </svg>
                </div>

                {/* End Cash-Out Hub */}
                <div style={{
                  background: 'rgba(255, 0, 64, 0.05)',
                  border: '1px solid var(--risk-critical-border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  textAlign: 'center',
                  boxShadow: 'var(--risk-critical-glow)',
                  width: 180,
                  zIndex: 5
                }}>
                  <div style={{ fontSize: 8.5, color: 'var(--risk-critical)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>LAUNDERING TARGET HUB</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {selectedWhale.to}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 2 }}>Mixer Deposit Node / Wasabi</div>
                </div>

                {/* Keyframe styles */}
                <style>{`
                  @keyframes split-flow-left {
                    0% { top: 0px; left: 195px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 60px; left: 60px; opacity: 0; }
                  }
                  @keyframes split-flow-mid {
                    0% { top: 0px; left: 195px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 60px; left: 195px; opacity: 0; }
                  }
                  @keyframes split-flow-right {
                    0% { top: 0px; left: 195px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 60px; left: 330px; opacity: 0; }
                  }
                `}</style>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 10px', color: 'var(--text-3)', fontSize: 12, fontFamily: 'Inter' }}>
                Select a whale transaction to decode splitting pathways.
              </div>
            )}
          </div>

          {/* AI Threat Intel Panel */}
          <div className="glass-card" style={{ padding: 20, minHeight: 220, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Cpu size={16} className="text-violet" />
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Forensic Investigation Summaries
              </div>
            </div>

            {selectedWhale ? (
              aiLoading && !aiReport ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
                  <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                  <span>Streaming forensic evaluation...</span>
                </div>
              ) : (
                <div style={{ background: 'var(--glass-01)', border: '1px solid var(--border-1)', borderRadius: 8, padding: 12 }}>
                  <pre style={{ margin: 0, fontFamily: 'Inter', fontSize: 11.5, color: 'var(--text-1)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {aiReport}
                  </pre>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12, border: '1px dashed var(--border-1)', borderRadius: 8, padding: '16px 12px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                Awaiting entity selection to parse threats.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
