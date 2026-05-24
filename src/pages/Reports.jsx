import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  FileText, Plus, ShieldCheck, Download, Trash2, 
  ChevronRight, Cpu, AlertTriangle, Info 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { audioEngine } from '../services/audioEngine';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function Reports() {
  const store = useStore();
  const selectedTx = store.selectedTransaction;

  const [caseTitle, setCaseTitle] = useState('');
  const [investigator, setInvestigator] = useState('Compliance Officer #88');
  const [narrative, setNarrative] = useState('');
  const [urgency, setUrgency] = useState('HIGH RISK');
  const [actionTaken, setActionTaken] = useState('Freeze withdrawal channels and watchlist target node');
  
  const [cases, setCases] = useState([
    {
      id: 'SAR-2026-402',
      title: 'Tornado Cash Cascade Mixer Obfuscation',
      investigator: 'Compliance Officer #88',
      date: '2026-05-24T18:14:00Z',
      urgency: 'CRITICAL',
      valueUsd: 1092000,
      hash: '0x3F8a5d3A2B1C2d8B5c7E9fA0b1c9F7A2c3B4C5D6E',
      from: '0x3F8a5d3A2B1C2d8B5c7E9fA0b1c9F7A2c3B4C5D6E',
      to: '0x905Ab8EBFED5d11A13C25D414e251DaFE3b00C6B',
      narrative: 'Target wallet interacted directly with the Tornado Cash privacy pool routing 350.00 ETH. Transfer indicates layering and anonymization behavior designed to bypass standard KYC compliance thresholds.',
      actionTaken: 'Flagged destination contract and dispatched alert notifications to centralized exchange hubs.'
    }
  ]);

  // Pre-load form if a transaction is selected
  useEffect(() => {
    if (selectedTx) {
      setCaseTitle(`Exploit / Laundering Flow [${selectedTx.hash.substring(0, 10)}]`);
      setUrgency(selectedTx.threatLevel || 'HIGH RISK');
      setNarrative(selectedTx.aiReasoning || `Suspicious transfer of ${formatCurrency(selectedTx.valueUsd)} on ${selectedTx.chain}. Rules triggered: ${selectedTx.rulesTriggered?.join(', ') || 'None'}`);
    } else {
      setCaseTitle('');
      setNarrative('');
    }
  }, [selectedTx]);

  const handleCreateCase = (e) => {
    e.preventDefault();
    if (!caseTitle.trim()) return;
    audioEngine.playCritical();

    const newCase = {
      id: `SAR-2026-${Math.floor(Math.random() * 900) + 100}`,
      title: caseTitle,
      investigator,
      date: new Date().toISOString(),
      urgency,
      valueUsd: selectedTx ? selectedTx.valueUsd : 50000 + Math.random() * 200000,
      hash: selectedTx ? selectedTx.hash : `0x${Math.random().toString(16).substring(2, 10)}...`,
      from: selectedTx ? selectedTx.from : '0xMockSourceWalletAddress',
      to: selectedTx ? selectedTx.to : '0xMockDestWalletAddress',
      narrative,
      actionTaken
    };

    setCases(prev => [newCase, ...prev]);
    
    // Reset form
    setCaseTitle('');
    setNarrative('');
    store.setSelectedTransaction(null);
  };

  const handleExportPDF = (c) => {
    audioEngine.playClick();
    const doc = new jsPDF();
    
    // Background Dark styling
    doc.setFillColor(6, 11, 24); // Deep Navy
    doc.rect(0, 0, 210, 297, 'F');

    // Header border
    doc.setDrawColor(0, 245, 255); // Cyan
    doc.setLineWidth(1);
    doc.line(14, 38, 196, 38);

    // Title
    doc.setTextColor(0, 245, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FINGUARD X — FINANCIAL THREAT INTELLIGENCE', 14, 25);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate
    doc.text(`OFFICIAL SECURE SAR COMPLIANCE CASE FILE — ${c.id}`, 14, 32);

    // Metadata block
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`DATE GENERATED: ${formatDate(c.date)}`, 14, 48);
    doc.text(`INVESTIGATOR: ${c.investigator}`, 14, 55);
    doc.text(`SECURITY LEVEL: ${c.urgency}`, 14, 62);
    doc.text(`VALUE USD: ${formatCurrency(c.valueUsd)}`, 14, 69);

    // Transaction Details table
    doc.autoTable({
      startY: 78,
      theme: 'grid',
      head: [['Parameter', 'Decoded Transaction Value']],
      body: [
        ['Transaction Hash', c.hash],
        ['Origin Wallet Address', c.from],
        ['Destination Target Address', c.to],
        ['Financial Threat Score', c.urgency === 'CRITICAL' ? '92/100' : '74/100']
      ],
      styles: { fillColor: [15, 23, 42], textColor: [241, 245, 249], lineColor: [0, 245, 255], lineWidth: 0.1 },
      headStyles: { fillColor: [0, 245, 255], textColor: [2, 4, 10], fontStyle: 'bold' }
    });

    // Narrative Block
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setTextColor(180, 74, 255); // Violet
    doc.setFontSize(13);
    doc.text('FORENSIC INVESTIGATION NARRATIVE:', 14, finalY);
    
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10.5);
    doc.setFont('Helvetica', 'normal');
    const splitNarrative = doc.splitTextToSize(c.narrative, 180);
    doc.text(splitNarrative, 14, finalY + 8);

    // Action Taken
    const actionY = finalY + 8 + (splitNarrative.length * 6) + 8;
    doc.setTextColor(0, 214, 143); // Emerald
    doc.setFontSize(13);
    doc.text('MITIGATION RESOLUTION ACTIONS TAKEN:', 14, actionY);
    
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10.5);
    const splitAction = doc.splitTextToSize(c.actionTaken, 180);
    doc.text(splitAction, 14, actionY + 8);

    // Footer signature
    doc.setDrawColor(255, 255, 255, 0.05);
    doc.line(14, 275, 196, 275);
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text('CLASSIFIED CYBER SECURITY COMPLIANCE RECORD — FINCEN DECRYPT DOCUMENT', 14, 282);

    doc.save(`FinGuard_SAR_Report_${c.id}.pdf`);
  };

  const handleDeleteCase = (id) => {
    audioEngine.playClick();
    setCases(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, height: 'calc(100vh - 120px)' }}>
      
      {/* Left panel: Case drafting form */}
      <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ borderBottom: '1px solid var(--border-1)', paddingBottom: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: '#fff' }}>SAR Compliance workspace</h2>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>Compile and document suspicious transaction activities into official compliance PDFs.</p>
          </div>
          <FileText size={16} className="text-cyan animate-pulse" />
        </div>

        <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>Case Title</label>
            <input 
              className="glass-input"
              value={caseTitle}
              onChange={e => setCaseTitle(e.target.value)}
              placeholder="e.g. Exploitative Tornado Cash layering transfer"
              required
              style={{ paddingLeft: 12, height: 38 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>Investigator ID</label>
              <input 
                className="glass-input"
                value={investigator}
                onChange={e => setInvestigator(e.target.value)}
                required
                style={{ paddingLeft: 12, height: 38 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>Urgency Level</label>
              <select
                value={urgency}
                onChange={e => setUrgency(e.target.value)}
                style={{ width: '100%', background: 'var(--glass-01)', border: '1px solid var(--border-1)', borderRadius: 8, color: 'var(--text-2)', fontSize: 12, padding: '7px 12px', outline: 'none', height: 38, cursor: 'pointer' }}
              >
                {['SAFE', 'WATCHLIST', 'HIGH RISK', 'CRITICAL'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 10.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', margin: 0 }}>Forensic Narrative</label>
              <button
                type="button"
                onClick={async () => {
                  audioEngine.playClick();
                  const targetStr = selectedTx 
                    ? `transaction ${selectedTx.hash} on ${selectedTx.chain} with value $${selectedTx.valueUsd} and score ${selectedTx.fraudScore}. Risk Reason: ${selectedTx.reason || 'None'}` 
                    : `the general active threat indices (FTI Index: ${store.stats?.threatIndex || 42}/100)`;
                  
                  setNarrative("Drafting SAR intelligence via Gemini AI...");
                  
                  try {
                    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'your_github_secret_gemini_key_here') {
                      const genAI = new GoogleGenerativeAI(apiKey);
                      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                      const prompt = `Write a professional, enterprise-grade, highly technical, and concise suspicious activity report (SAR) compliance narrative for: ${targetStr}. Describe layering, structuring, and potential mixer pooling. Limit to 100 words.`;
                      const result = await model.generateContent(prompt);
                      setNarrative(result.response.text());
                    } else {
                      setTimeout(() => {
                        setNarrative(`[SUSPICIOUS ACTIVITY REPORT SUMMARY]\n\nAt ${new Date().toLocaleTimeString()} UTC, the automated AML detection system identified a critical structuring chain. Originating wallet routed funds totaling $${selectedTx ? Math.floor(selectedTx.valueUsd).toLocaleString() : '1,092,000'} USD via multi-hop split routing into intermediate contract addresses. The transaction velocity and night-time activity correlate with historical mixer obfuscation techniques. Recommend immediate freezing of outbound withdrawal rails.`);
                      }, 1000);
                    }
                  } catch (e) {
                    setNarrative(`Inference failure: ${e.message}. Setup VITE_GEMINI_API_KEY inside .env.local.`);
                  }
                }}
                className="btn-ghost"
                style={{ padding: '3px 8px', fontSize: 9.5, borderColor: 'var(--border-violet)', color: 'var(--violet-400)', height: 22, display: 'flex', gap: 4, cursor: 'pointer' }}
              >
                <Cpu size={10} /> AI Draft Narrative
              </button>
            </div>
            <textarea 
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              placeholder="Describe the suspicious behavior pattern, rules violated, and destination clusters..."
              required
              style={{ width: '100%', height: 110, resize: 'none', padding: '10px 12px', background: 'var(--glass-01)', border: '1px solid var(--border-1)', borderRadius: 8, color: '#fff', fontSize: 12.5, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>Compliance Action Taken</label>
            <input 
              className="glass-input"
              value={actionTaken}
              onChange={e => setActionTaken(e.target.value)}
              placeholder="e.g. Frozen assets and filed suspicious activity flags"
              required
              style={{ paddingLeft: 12, height: 38 }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ justifyContent: 'center', height: 40, marginTop: 6 }}>
            <Plus size={14} /> CREATE CASE FILE
          </button>
        </form>
      </div>

      {/* Right panel: Log of compiled cases */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COMPILED COMPLIANCE RECORDS</span>
          <AlertTriangle size={14} className="text-violet animate-pulse" />
        </div>

        <div className="nav-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)', fontSize: 11.5 }}>
              No SAR compliance files generated yet.
            </div>
          ) : (
            cases.map((c) => (
              <div 
                key={c.id}
                style={{
                  background: 'rgba(5, 8, 18, 0.4)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 10,
                  padding: 12,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: '#fff' }}>{c.title}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{c.id} — {formatDate(c.date)}</div>
                  </div>
                  <span className={`badge`} style={{ 
                    background: c.urgency === 'CRITICAL' ? 'rgba(255,0,64,0.1)' : 'rgba(255,106,0,0.1)', 
                    color: c.urgency === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--risk-high)',
                    borderColor: c.urgency === 'CRITICAL' ? 'rgba(255,0,64,0.3)' : 'rgba(255,106,0,0.3)',
                    fontSize: 8.5
                  }}>
                    {c.urgency}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button 
                    className="btn-ghost" 
                    style={{ flex: 1, fontSize: 10.5, padding: '4px 8px', justifyContent: 'center' }}
                    onClick={() => handleExportPDF(c)}
                  >
                    <Download size={11} /> DOWNLOAD PDF
                  </button>
                  <button 
                    className="btn-ghost" 
                    style={{ fontSize: 10.5, padding: '4px 8px', borderColor: 'rgba(255,0,64,0.2)', color: 'var(--risk-critical)' }}
                    onClick={() => handleDeleteCase(c.id)}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
