import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Search, Pause, Play, Download, RefreshCw, 
  ShieldAlert, DollarSign, Zap, RefreshCcw,
  Moon, User, Package, X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { jsPDF } from 'jspdf';

const CHAIN_COLORS = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#00FFA3',
  USDT: '#26A17B',
};

const RISK_CONFIG = {
  'SAFE':                    { cls: 'badge-low',      label: 'Safe'     },
  'LOW':                     { cls: 'badge-low',      label: 'Low'      },
  'WATCHLIST':               { cls: 'badge-medium',   label: 'Watchlist'},
  'MEDIUM':                  { cls: 'badge-medium',   label: 'Medium'   },
  'HIGH RISK':               { cls: 'badge-high',     label: 'High'     },
  'HIGH':                    { cls: 'badge-high',     label: 'High'     },
  'CRITICAL':                { cls: 'badge-critical', label: 'Critical' },
  'ACTIVE LAUNDERING':       { cls: 'badge-critical', label: 'Laundering'},
  'FRAUD NETWORK DETECTED':  { cls: 'badge-critical', label: 'Fraud'   },
};

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[(level || '').toUpperCase()] || RISK_CONFIG['LOW'];
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.cls === 'badge-critical' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      )}
      {cfg.label}
    </span>
  );
}

function RiskBar({ score }) {
  const color = score >= 85 ? 'var(--risk-critical)' : score >= 60 ? 'var(--risk-high)' : score >= 35 ? 'var(--risk-medium)' : 'var(--risk-low)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 4, background: 'var(--border-0)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color, fontWeight: 500, minWidth: 22, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function IndicatorIcons({ tx }) {
  const indicators = [];
  if (tx.valueUsd > 1000000)   indicators.push({ Icon: DollarSign,  title: 'Large Amount', color: 'var(--risk-high)' });
  if (tx.fraudScore > 70)      indicators.push({ Icon: Zap,          title: 'High Velocity',color: 'var(--risk-critical)' });
  if (tx.isCircular)           indicators.push({ Icon: RefreshCcw,   title: 'Circular',     color: 'var(--risk-critical)' });
  if (tx.isSanctioned)        indicators.push({ Icon: ShieldAlert,  title: 'Sanctioned',   color: 'var(--risk-critical)' });
  if (tx.isNightTime)          indicators.push({ Icon: Moon,          title: 'Night-time',   color: 'var(--risk-medium)' });
  if (tx.isNewAccount)         indicators.push({ Icon: User,          title: 'New Account',  color: 'var(--risk-medium)' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {indicators.slice(0, 4).map(({ Icon, title, color }, i) => (
        <Icon key={i} size={13} style={{ color }} title={title} />
      ))}
      {indicators.length > 4 && (
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'Inter' }}>+{indicators.length - 4}</span>
      )}
    </div>
  );
}

export default function LiveFeed() {
  const store = useStore();
  const transactions = store.transactions;

  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (search && !tx.hash?.includes(search) && !tx.from?.includes(search) && !tx.to?.includes(search)) return false;
      if (chainFilter !== 'ALL' && tx.chain !== chainFilter) return false;
      if (riskFilter === 'HIGH+') {
        const score = tx.fraudScore || 0;
        if (score < 60) return false;
      }
      return true;
    });
  }, [transactions, search, chainFilter, riskFilter]);

  const toggleSelect = (hash) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(hash) ? next.delete(hash) : next.add(hash);
      return next;
    });
  };

  const handleExportCSV = () => {
    const rows = [
      ['Hash', 'Chain', 'From', 'To', 'Value USD', 'Risk Score', 'Threat Level', 'Time'],
      ...filtered.map(tx => [tx.hash, tx.chain, tx.from, tx.to, tx.valueUsd, tx.fraudScore, tx.threatLevel, tx.timestamp])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'finguard_feed.csv'; a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('FinGuard AI - Live Transaction Report', 14, 20);
    doc.setFontSize(9);
    filtered.slice(0, 50).forEach((tx, i) => {
      doc.text(`${i + 1}. ${tx.hash?.substring(0, 20)}... | ${tx.chain} | $${Math.floor(tx.valueUsd).toLocaleString()} | ${tx.threatLevel}`, 14, 30 + i * 6);
    });
    doc.save('finguard_live_report.pdf');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: 200, flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              className="glass-input"
              placeholder="Search hash, address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Chain filter */}
          <select
            value={chainFilter}
            onChange={e => setChainFilter(e.target.value)}
            style={{
              background: 'var(--glass-01)', border: '1px solid var(--border-1)', borderRadius: 8,
              color: 'var(--text-2)', fontSize: 12, padding: '7px 12px', outline: 'none',
              fontFamily: 'Inter', cursor: 'pointer'
            }}
          >
            {['ALL', 'BTC', 'ETH', 'SOL', 'USDT'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            style={{
              background: 'var(--glass-01)', border: '1px solid var(--border-1)', borderRadius: 8,
              color: 'var(--text-2)', fontSize: 12, padding: '7px 12px', outline: 'none',
              fontFamily: 'Inter', cursor: 'pointer'
            }}
          >
            <option value="ALL">All Risk</option>
            <option value="HIGH+">High+ Only</option>
          </select>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '6px 12px', borderColor: 'var(--border-violet)', color: 'var(--violet-400)' }}
              onClick={() => store.setCustomAIPrompt("Summarize all anomalies and suspicious transaction trends visible in our current transaction feed.")}
            >
              <Zap size={13} /> AI Summarize
            </button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleExportCSV}>
              <Download size={13} /> Export CSV
            </button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleExportPDF}>
              <Download size={13} /> Export PDF
            </button>
            <button
              className={paused ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => setPaused(p => !p)}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={`status-dot ${paused ? 'status-dot-red' : 'status-dot-green'}`} />
              <span style={{ fontSize: 11, color: paused ? 'var(--risk-critical)' : 'var(--risk-low)', fontFamily: 'Inter', fontWeight: 500 }}>
                {paused ? 'PAUSED' : 'LIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Count */}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono' }}>
          Showing <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{filtered.length.toLocaleString()}</span> / {transactions.length.toLocaleString()} transactions
          {search && <> — filtered by "<span style={{ color: 'var(--cyan-500)' }}>{search}</span>"</>}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table className="data-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Chain</th>
                <th>TxID</th>
                <th>From</th>
                <th>To</th>
                <th>USD Value</th>
                <th>Score</th>
                <th>Indicators</th>
                <th>Risk</th>
                <th>Age</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)', fontSize: 12, fontFamily: 'Inter' }}>
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 200).map((tx, i) => {
                  const isCritical = tx.fraudScore >= 85;
                  const isHigh = tx.fraudScore >= 60 && !isCritical;
                  const age = Math.round((Date.now() - (tx.timestamp || Date.now())) / 1000);
                  const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 3600)}h ago`;
                  return (
                    <tr
                      key={tx.hash || i}
                      className={isCritical ? 'row-critical' : isHigh ? 'row-high' : ''}
                      onClick={() => store.setSelectedTransaction(tx)}
                      style={{ animation: i < 3 ? `fadeUp 0.3s ${i * 0.06}s both` : undefined }}
                    >
                      <td style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHAIN_COLORS[tx.chain] || 'var(--text-3)', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--text-2)' }}>{tx.chain}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="address-chip">{(tx.hash || '').substring(0, 10)}...</span>
                          {tx.isSimulated && (
                            <span style={{ fontSize: 8.5, background: 'rgba(180, 74, 255, 0.15)', border: '1px solid var(--border-violet)', color: 'var(--violet-400)', padding: '1px 4px', borderRadius: 3, fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                              SIMULATED
                            </span>
                          )}
                        </div>
                      </td>
                      <td><span className="address-chip">{(tx.from || '').substring(0, 8)}...</span></td>
                      <td><span className="address-chip">{(tx.to || '').substring(0, 8)}...</span></td>
                      <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--cyan-400)', fontWeight: 500 }}>{formatCurrency(tx.valueUsd)}</span></td>
                      <td><RiskBar score={tx.fraudScore || 0} /></td>
                      <td><IndicatorIcons tx={tx} /></td>
                      <td><RiskBadge level={tx.threatLevel} /></td>
                      <td><span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>{ageStr}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={e => { 
                              e.stopPropagation(); 
                              store.setSelectedTransaction(tx);
                              store.setCustomAIPrompt(`Perform forensic threat diagnostics on transaction ${tx.hash}. Explain the risk score of ${tx.fraudScore} and triggered rules.`);
                            }}
                            style={{ fontSize: 11, color: 'var(--violet-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500, opacity: 0.7, padding: '4px 8px', borderRadius: 4, transition: 'opacity 150ms' }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0.7}
                          >
                            AI Explain
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); store.setSelectedTransaction(tx); }}
                            style={{ fontSize: 11, color: 'var(--cyan-500)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500, opacity: 0.7, padding: '4px 8px', borderRadius: 4, transition: 'opacity 150ms' }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0.7}
                          >
                            Investigate →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 48, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-raised)', border: '1px solid var(--border-1)',
          borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: 'var(--shadow-4)', zIndex: 100, fontSize: 13
        }}>
          <span style={{ color: 'var(--text-2)' }}><strong style={{ color: 'var(--text-1)' }}>{selected.size}</strong> rows selected</span>
          <button className="btn-ghost" style={{ fontSize: 12 }}><Download size={13} /> Export</button>
          <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--risk-critical)', borderColor: 'var(--risk-critical-border)' }}>
            <ShieldAlert size={13} /> Flag All
          </button>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelected(new Set())}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}
