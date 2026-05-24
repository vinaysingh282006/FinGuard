import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { lookupAddressIntel } from '../services/blockchainService';
import { 
  Search, ShieldAlert, Cpu, ArrowUpRight, ArrowDownLeft, 
  Coins, Activity, Calendar, Award, ExternalLink 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import BehavioralFingerprint from '../components/shared/BehavioralFingerprint';
import { generateAIResponse } from '../services/geminiService';
import { audioEngine } from '../services/audioEngine';

// FTI Gauge component
function FtiGaugeSmall({ score }) {
  let color = 'var(--emerald-500)';
  if (score >= 91) color = 'var(--violet-500)';
  else if (score >= 81) color = 'var(--risk-critical)';
  else if (score >= 61) color = 'var(--risk-high)';
  else if (score >= 31) color = 'var(--cyan-500)';

  const radius = 28;
  const strokeDash = 2 * Math.PI * radius;
  const offset = strokeDash - (score / 100) * strokeDash;

  return (
    <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
      <svg viewBox="0 0 76 76" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="5" />
        <circle 
          cx="38" 
          cy="38" 
          r={radius} 
          fill="none" 
          stroke={color} 
          strokeWidth="5"
          strokeDasharray={strokeDash}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 800ms ease, stroke 800ms ease', filter: `drop-shadow(0 0 4px ${color}aa)` }} 
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: '#fff' }}>{score}</span>
        <span style={{ fontSize: 7, color: 'var(--text-3)', fontWeight: 700 }}>FTI</span>
      </div>
    </div>
  );
}

export default function AddressLookup() {
  const store = useStore();
  const selectedAddress = store.selectedAddress;

  const [inputAddr, setInputAddr] = useState('');
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Auto-trigger on store selection
  useEffect(() => {
    if (selectedAddress) {
      setInputAddr(selectedAddress);
      fetchIntel(selectedAddress);
    }
  }, [selectedAddress]);

  const fetchIntel = async (address) => {
    setLoading(true);
    setIntel(null);
    setAiReport('');
    audioEngine.playClick();

    try {
      const data = await lookupAddressIntel(address);
      setIntel(data);
      setLoading(false);
      
      // Trigger AI profile assessment
      triggerAIEvaluation(data);
    } catch (e) {
      setLoading(false);
    }
  };

  const triggerAIEvaluation = async (data) => {
    setAiLoading(true);
    setAiReport('');

    const systemPrompt = `You are an expert blockchain forensics agent. 
Analyze the intelligence profile of this wallet address:
- Address: ${data.address}
- Status: ${data.status}
- Risk Level: ${data.riskLevel} (${data.riskScore}/100 FTI)
- Entity Owner: ${data.owner}
- Behavioral DNA Tag: ${data.behavioralProfile}
- Total Flows: Received ${formatCurrency(data.totalReceivedUsd)}, Sent ${formatCurrency(data.totalSentUsd)}
- TX Count: ${data.transactionCount}

Generate a concise threat summary explaining if this wallet represents a laundering risk, sanctioned entity, privacy mixer, or safe user. Explain counterparty risk under the heading 'THREAT INTELLIGENCE SUMMARY:'. Keep it under 140 words.`;

    try {
      const response = await generateAIResponse(systemPrompt);
      if (!response) {
        setAiLoading(false);
        return;
      }
      
      let index = 0;
      const timer = setInterval(() => {
        if (index < response.length) {
          setAiReport((prev) => prev + response[index]);
          index++;
        } else {
          clearInterval(timer);
          setAiLoading(false);
        }
      }, 5);
    } catch (error) {
      console.error('Failed to generate AI evaluation:', error);
      setAiLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputAddr.trim()) {
      store.setSelectedAddress(inputAddr.trim());
    }
  };

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Search Input Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="glass-input"
              value={inputAddr}
              onChange={e => setInputAddr(e.target.value)}
              placeholder="Enter Ethereum, Bitcoin, or Solana address to decode intel..."
              style={{ paddingLeft: 36, fontSize: 13, height: 42 }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: 42, padding: '0 20px' }}>
            DECODE INTEL
          </button>
        </form>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span className="status-dot status-dot-cyan animate-pulse" style={{ width: 12, height: 12 }} />
          <div style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.05em' }}>QUERYING DECENTRALIZED DATA NODES...</div>
        </div>
      ) : intel ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
          
          {/* Left: General Profile & flows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Identity Profile Overview */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 15, fontFamily: 'Space Grotesk', fontWeight: 800, color: '#fff' }}>Target Decoded Signature</h2>
                    <span className={`badge ${intel.riskLevel === 'SAFE' ? 'badge-low' : intel.riskLevel === 'WATCHLIST' ? 'badge-medium' : intel.riskLevel === 'HIGH RISK' ? 'badge-high' : 'badge-critical'}`}>
                      {intel.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11.5, color: 'var(--cyan-400)', marginTop: 4, overflowWrap: 'anywhere' }}>
                    {intel.address}
                  </div>
                </div>
                <FtiGaugeSmall score={intel.riskScore} />
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
                {[
                  { label: 'Total Volume Received', val: formatCurrency(intel.totalReceivedUsd), icon: ArrowDownLeft, color: 'var(--risk-low)' },
                  { label: 'Total Volume Sent', val: formatCurrency(intel.totalSentUsd), icon: ArrowUpRight, color: 'var(--cyan-500)' },
                  { label: 'Net Flow Balance', val: formatCurrency(intel.totalReceivedUsd - intel.totalSentUsd), icon: Coins, color: 'var(--violet-500)' }
                ].map(({ label, val, icon: Icon, color }) => (
                  <div key={label} style={{ background: 'rgba(2,4,10,0.5)', border: '1px solid var(--border-0)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 8.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#fff' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated transaction history */}
            <div className="glass-card" style={{ padding: 0 }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>RECENT TRANSFERS</span>
                <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>{intel.transactionCount} transactions detected</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 240 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Direction</th>
                      <th>Counterparty</th>
                      <th>USD Value</th>
                      <th>Risk score</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dir: 'IN', peer: '0xLazarusHoldings_Primary', val: intel.totalReceivedUsd * 0.4, score: 98, time: '2h ago' },
                      { dir: 'OUT', peer: '0xDubaiOTC_ExchangeHub', val: intel.totalSentUsd * 0.25, score: 76, time: '4h ago' },
                      { dir: 'OUT', peer: '0xBinanceColdWallet_5', val: intel.totalSentUsd * 0.15, score: 10, time: '1d ago' },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ color: row.dir === 'IN' ? 'var(--risk-low)' : 'var(--cyan-500)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                          {row.dir === 'IN' ? '📥 INCOMING' : '📤 OUTGOING'}
                        </td>
                        <td><span className="address-chip">{row.peer.substring(0, 15)}...</span></td>
                        <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#fff', fontWeight: 700 }}>{formatCurrency(row.val)}</span></td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: row.score >= 80 ? 'var(--risk-critical)' : row.score >= 50 ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                          {row.score}
                        </td>
                        <td><span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono' }}>{row.time}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right: Behavioral DNA & AI Assessment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Behavioral Fingerprint DNA */}
            <BehavioralFingerprint indicators={[]} score={intel.riskScore} />

            {/* AI Forensics Report */}
            <div className="glass-card" style={{ padding: 20, minHeight: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Cpu size={14} className="text-violet" />
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gemini Forensics Narrative
                </span>
              </div>
              {aiLoading && !aiReport ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-3)' }}>
                  <span className="status-dot status-dot-cyan animate-pulse" />
                  <span>Generating cognitive wallet fingerprint...</span>
                </div>
              ) : (
                <div style={{ background: 'var(--glass-01)', border: '1px solid var(--border-1)', borderRadius: 8, padding: 12 }}>
                  <pre style={{ margin: 0, fontFamily: 'Inter', fontSize: 11.5, color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {aiReport}
                  </pre>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
          <ShieldAlert size={36} style={{ marginBottom: 12, opacity: 0.5, display: 'inline-block' }} />
          <div style={{ fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NO ADDRESS UNDER ACTIVE INVESTIGATION</div>
          <div style={{ fontSize: 11.5, marginTop: 4, color: 'var(--text-3)' }}>Enter a wallet address above to load forensic transaction metrics.</div>
        </div>
      )}

    </div>
  );
}
