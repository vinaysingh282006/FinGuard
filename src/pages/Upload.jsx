import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { scoreFraud } from '../utils/fraudScoring';
import { 
  FileSpreadsheet, UploadCloud, RefreshCw, CheckCircle, 
  ShieldAlert, Sparkles, PlusCircle, AlertCircle, FileText, ArrowRight 
} from 'lucide-react';
import Papa from 'papaparse';
import { formatCurrency } from '../utils/formatters';
import { audioEngine } from '../services/audioEngine';

export default function Upload() {
  const store = useStore();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [results, setResults] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setScanning(true);
    setScannedCount(0);
    setResults(null);
    setParsedData([]);
    audioEngine.playWarning();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data;
        const total = rows.length;

        // Process rows in batches to show loading animation
        const processed = [];
        let amlFlags = 0;
        let criticalFlags = 0;
        let maxScore = 0;

        for (let i = 0; i < total; i++) {
          const row = rows[i];
          
          // Parse fields with fallback
          const valUsd = parseFloat((row.valueUsd || row.ValueUsd || row.value || '0').replace(/[^0-9.]/g, ''));
          const tx = {
            hash: row.hash || row.Hash || `0x${Math.random().toString(16).substring(2, 10)}...`,
            chain: (row.chain || row.Chain || 'ETH').toUpperCase(),
            from: row.from || row.From || '0xUnknownOriginAddress',
            to: row.to || row.To || '0xUnknownDestAddress',
            valueUsd: valUsd,
            value: row.value || row.Value || valUsd,
            timestamp: row.timestamp || row.Timestamp || new Date().toISOString(),
            velocityCount: parseInt(row.velocityCount || row.VelocityCount || '0'),
            hopCount: parseInt(row.hopCount || row.HopCount || '1')
          };

          const scored = scoreFraud(tx);
          processed.push(scored);

          if (scored.fraudScore >= 61) amlFlags++;
          if (scored.fraudScore >= 81) criticalFlags++;
          if (scored.fraudScore > maxScore) maxScore = scored.fraudScore;

          // Update scan counter every 5 rows to prevent blocking UI thread
          if (i % 5 === 0 || i === total - 1) {
            setScannedCount(i + 1);
            await new Promise(r => setTimeout(r, 20));
          }
        }

        setParsedData(processed);
        setScanning(false);
        setResults({
          total,
          amlFlags,
          criticalFlags,
          maxScore
        });
        audioEngine.playCritical();
      },
      error: () => {
        setScanning(false);
        audioEngine.playWarning();
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImportToLiveStore = () => {
    audioEngine.playClick();
    parsedData.forEach(tx => {
      store.addTransaction(tx);
      if (tx.fraudScore >= 61) {
        store.addAlert({
          id: Math.random().toString(),
          timestamp: tx.timestamp,
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          chain: tx.chain,
          valueUsd: tx.valueUsd,
          fraudScore: tx.fraudScore,
          threatLevel: tx.threatLevel,
          reason: tx.rulesTriggered[0] || 'Imported Risk Element'
        });
      }
    });
    setResults(prev => ({ ...prev, imported: true }));
  };

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Upload Drag & Drop Box */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              LEDGER SCANNER CONSOLE
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Upload transaction CSV logs to trace structural AML violations offline.</div>
          </div>
          <FileSpreadsheet size={15} className="text-cyan animate-pulse" />
        </div>

        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(0, 245, 255, 0.04)' : 'transparent',
            border: dragActive ? '2px dashed var(--cyan-500)' : '2px dashed var(--border-1)',
            borderRadius: '0 0 12px 12px',
            margin: '20px',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            position: 'relative'
          }}
        >
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleChange} 
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
            disabled={scanning}
          />
          <UploadCloud size={32} style={{ color: dragActive ? 'var(--cyan-500)' : 'var(--text-3)', marginBottom: 12, display: 'inline-block' }} />
          <div style={{ fontSize: 13, color: '#fff', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
            {fileName ? `LOADED: ${fileName}` : 'DRAG & DROP CSV LEDGER OR CLICK TO BROWSE'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4, fontFamily: 'Inter' }}>
            Headers required: Hash, Chain, From, To, ValueUsd. SkipEmptyLines enabled automatically.
          </div>
        </div>
      </div>

      {/* Loading Scanning status */}
      {scanning && (
        <div className="glass-card animate-pulse" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCw size={14} className="animate-spin text-cyan" />
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SCANNED {scannedCount} RECORD NODES IN CURRENT ARRAY...
            </span>
          </div>
          <div style={{ width: 140, height: 4, background: 'var(--border-0)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--cyan-500)', width: parsedData.length ? '100%' : '10%' }} />
          </div>
        </div>
      )}

      {/* Scan Results Board */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
          
          {/* Left panel: Scan Metrics Summary */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12.5, color: 'var(--cyan-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} />
              SCAN LOG ANALYSIS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Rows Processed', val: results.total, color: '#fff' },
                { label: 'AML Threat Triggers', val: results.amlFlags, color: 'var(--risk-high)' },
                { label: 'Critical Exceptions', val: results.criticalFlags, color: 'var(--risk-critical)' },
                { label: 'Highest Fraud Score', val: `${results.maxScore}/100`, color: 'var(--violet-400)' }
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-0)', paddingBottom: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ color, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Import to store action */}
            {results.imported ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--risk-low)', fontSize: 11.5, fontFamily: 'Space Grotesk', fontWeight: 700, background: 'rgba(0, 214, 143, 0.05)', border: '1px dashed var(--risk-low-border)', borderRadius: 8, padding: 10 }}>
                <CheckCircle size={14} />
                IMPORTED SUCCESSFULLY INTO LIVE SYSTEM
              </div>
            ) : (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleImportToLiveStore}>
                <PlusCircle size={14} style={{ fill: 'none' }} />
                IMPORT SCANS TO LIVE FEED
              </button>
            )}
          </div>

          {/* Right panel: Scanned ledger details */}
          <div className="glass-card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SCANNED THREAT ARRAY</span>
              <span className="status-dot status-dot-cyan" />
            </div>

            <div style={{ overflowX: 'auto', maxHeight: 340 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Chain</th>
                    <th>Hash</th>
                    <th>USD Value</th>
                    <th>Score</th>
                    <th>Heuristics</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 50).map((row, idx) => {
                    const isCritical = row.fraudScore >= 81;
                    const isHigh = row.fraudScore >= 61 && !isCritical;
                    return (
                      <tr 
                        key={idx}
                        className={isCritical ? 'row-critical' : isHigh ? 'row-high' : ''}
                        onClick={() => store.setSelectedTransaction(row)}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.chain === 'BTC' ? '#F7931A' : '#627EEA' }} />
                            <span style={{ fontFamily: 'Space Grotesk', fontSize: 11.5, fontWeight: 700 }}>{row.chain}</span>
                          </div>
                        </td>
                        <td><span className="address-chip">{row.hash.substring(0, 15)}...</span></td>
                        <td>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--cyan-400)', fontWeight: 700 }}>
                            {formatCurrency(row.valueUsd)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: isCritical ? 'var(--risk-critical)' : isHigh ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                            {row.fraudScore}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            {row.rulesTriggered.join(', ') || 'Clean Ledger'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: 'var(--cyan-500)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>INSPECT →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
