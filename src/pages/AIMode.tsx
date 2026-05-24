import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  Cpu,
  Send,
  Terminal,
  FileText,
  Search,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Lock,
} from 'lucide-react';
import { generateAIResponseStream } from '../services/geminiService';
import { lookupAddressIntel } from '../services/blockchainService';

// Lightweight Markdown Formatter
function TerminalMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  const rendered = lines.map((line, idx) => {
    // Fenced Code block toggle (represented simply)
    if (line.startsWith('```')) {
      return null; // clean simple view
    }

    // Bold text mapping
    let cleanLine = line;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} style={{ color: 'var(--cyan-400)' }}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    const content = parts.length > 0 ? parts : cleanLine;

    // Bullet items
    if (line.startsWith('•') || line.startsWith('*') || line.startsWith('-')) {
      return (
        <li key={idx} style={{ marginLeft: 16, marginBottom: 4, listStyleType: 'square', color: 'var(--text-2)' }}>
          {content}
        </li>
      );
    }

    // Headers
    if (line.startsWith('#')) {
      const depth = line.match(/^#+/)?.[0].length || 1;
      const headerText = line.replace(/^#+\s*/, '');
      const fontSize = depth === 1 ? 16 : depth === 2 ? 14 : 12;
      return (
        <div key={idx} style={{ 
          fontFamily: 'Space Grotesk', 
          fontWeight: 800, 
          color: 'var(--violet-400)', 
          marginTop: 14, 
          marginBottom: 6,
          fontSize,
          borderBottom: depth === 1 ? '1px solid rgba(180, 74, 255, 0.2)' : 'none',
          paddingBottom: depth === 1 ? 4 : 0
        }}>
          {headerText}
        </div>
      );
    }

    return (
      <p key={idx} style={{ margin: '0 0 8px 0', color: 'var(--text-2)', lineHeight: 1.6 }}>
        {content}
      </p>
    );
  });

  return <div style={{ fontSize: 12.5, fontFamily: 'Inter' }}>{rendered}</div>;
}

export default function AIMode() {
  const store = useStore() as any;
  const aiMemory = store.aiMemory || { visitedAddresses: [], investigatedTxs: [], previousQuestions: [] };

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; streaming?: boolean }>>([
    {
      role: 'assistant',
      content: `**FINGUARD COGNITIVE THREAT TERMINAL ONLINE**
Authorized session active. I am connected directly to **Gemini AI Core**.

Pasting an address or transaction hash will trigger deep intelligence decoders. 
Use terminal command macros or input queries below. How can I assist with your blockchain audit today?`,
    },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync custom prompt from store (e.g. from Explain Alert clicks)
  useEffect(() => {
    if (store.customAIPrompt) {
      setInputPrompt(store.customAIPrompt);
      store.setCustomAIPrompt(null); // Clear prompt
    }
  }, [store.customAIPrompt]);

  // Copy to clipboard
  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleSendPrompt = async (promptOverride?: string) => {
    const query = (promptOverride || inputPrompt).trim();
    if (!query) return;

    setInputPrompt('');
    setLoading(true);

    // Save question to store memory
    store.addQuestionToMemory(query);

    const cleanQuery = query.trim();
    const isEthAddr = /^0x[a-fA-F0-9]{40}$/.test(cleanQuery);
    const isBtcAddr = /^(bc1|[13])[a-zA-HJ-NP-Z1-9]{25,59}$/.test(cleanQuery);
    const isSolAddr = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanQuery);
    const isTxHash = /^0x[a-fA-F0-9]{64}$/.test(cleanQuery);

    let finalPrompt = query;
    let userDisplayMsg = query;
    let initialAssistantMsg = 'Connecting to AI node...';

    if (isEthAddr || isBtcAddr || isSolAddr) {
      userDisplayMsg = `Analyze Address: ${cleanQuery}`;
      initialAssistantMsg = `🔍 Resolving ledger for wallet address ${cleanQuery}...`;

      // Show user message and resolving state immediately
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userDisplayMsg },
        { role: 'assistant', content: initialAssistantMsg, streaming: true }
      ]);

      const assistantIndex = messages.length + 1;

      try {
        const intel = await lookupAddressIntel(cleanQuery, store.prices);
        const ledgerSummary = `Real On-Chain Ledger Data for Wallet Address: ${cleanQuery}
- Current Balance (USD): $${intel.balanceUsd.toLocaleString()}
- Lifetime Received: $${intel.totalReceivedUsd.toLocaleString()}
- Lifetime Sent: $${intel.totalSentUsd.toLocaleString()}
- On-Chain Transaction Count: ${intel.transactionCount}
- Account Status: ${intel.status}
- Behavioral Profile: ${intel.behavioralProfile}
- First Active: ${intel.firstActive}
- Last Active: ${intel.lastActive}`;

        finalPrompt = `Perform a comprehensive security, money laundering, and risk audit on this blockchain wallet address using the following real-time ledger data.

${ledgerSummary}

Analyze if the transaction volumes, behavioral profile, and balances suggest suspicious movement, structuring (smurfing), mixing pool ingress, or compliance risk. Provide a structured audit report.`;

        // Update with resolving complete and trigger Gemini stream
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIndex] = { role: 'assistant', content: `🔍 Resolved ledger for wallet. Commencing Gemini Cognitive Threat Audit...`, streaming: true };
          return next;
        });

      } catch (err: any) {
        finalPrompt = `Analyze the blockchain wallet address: ${cleanQuery}. Connection to public nodes failed, but please evaluate standard threat vectors, laundering patterns, and monitoring procedures for this address format.`;
      }
    } else if (isTxHash) {
      userDisplayMsg = `Analyze Transaction: ${cleanQuery}`;
      initialAssistantMsg = `🔍 Querying transaction hash ${cleanQuery} telemetry...`;

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userDisplayMsg },
        { role: 'assistant', content: initialAssistantMsg, streaming: true }
      ]);

      const assistantIndex = messages.length + 1;

      let ledgerSummary = `Transaction Hash: ${cleanQuery} (Transaction is currently pending propagation)`;
      const matchTx = store.transactions.find((t: any) => t.hash?.toLowerCase() === cleanQuery.toLowerCase());
      if (matchTx) {
        ledgerSummary = `Real Transaction Telemetry:
- Tx Hash: ${cleanQuery}
- Source: ${matchTx.from}
- Destination: ${matchTx.to}
- Value (USD): $${parseFloat(matchTx.valueUsd || 0).toLocaleString()}
- Chain: ${matchTx.chain}
- Gas Units: ${matchTx.gas || 'N/A'}`;
      }

      finalPrompt = `Perform a forensic security audit on this blockchain transaction hash:

${ledgerSummary}

Identify indicators of circular routing, layering structures, sanctions evasion, or other compliance concerns.`;

      setMessages((prev) => {
        const next = [...prev];
        next[assistantIndex] = { role: 'assistant', content: `🔍 Found transaction telemetry. Commencing Gemini Cognitive Threat Audit...`, streaming: true };
        return next;
      });
    } else {
      // Normal Chat Flow
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userDisplayMsg },
        { role: 'assistant', content: initialAssistantMsg, streaming: true }
      ]);
    }

    const assistantIndex = messages.length + 1;
    const systemInstruction = `You are FinGuard X Cyberintelligence Agent. You analyze blockchain ledgers, EVM transactions, smart contracts, and crypto wallets. Decode laundering signatures, privacy shielding tunnels, Smurfing velocity anomalies, and bridge evasion. Structure responses clearly with bullet points and bold highlights.`;

    try {
      await generateAIResponseStream(
        finalPrompt,
        (currentText) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = { role: 'assistant', content: currentText, streaming: true };
            }
            return next;
          });
        },
        (completedText) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = { role: 'assistant', content: completedText, streaming: false };
            }
            return next;
          });
          setLoading(false);
        },
        systemInstruction
      );
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        if (next[assistantIndex]) {
          next[assistantIndex] = {
            role: 'assistant',
            content: `Threat node failure. AI stream interrupted. Details: ${err.message || err}`,
            streaming: false,
          };
        }
        return next;
      });
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 'calc(100vh - 120px)' }}>
      
      {/* LEFT SIDEBAR: Telemetry Targets & Memory */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4 }}>
        
        {/* Terminal Status Card */}
        <div className="glass-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--cyan-400)', textTransform: 'uppercase', marginBottom: 12 }}>
            <Terminal size={15} />
            Console Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI AGENT:</span>
              <span style={{ color: 'var(--risk-low)' }}>ENGAGED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ENGINE:</span>
              <span style={{ color: '#fff' }}>GEMINI 1.5 FLASH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CIPHER MODE:</span>
              <span style={{ color: 'var(--violet-400)' }}>STREAM_ON</span>
            </div>
          </div>
        </div>

        {/* Investigated Assets & Memory */}
        <div className="glass-card" style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-1)', textTransform: 'uppercase', marginBottom: 12 }}>
            <Sparkles size={14} />
            Forensic Telemetry
          </div>

          <div className="nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
            {/* Visited Addresses */}
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--violet-400)', fontFamily: 'Space Grotesk', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Tracked Wallets
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {aiMemory.visitedAddresses?.slice(0, 5).map((addr: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setInputPrompt(`/analyze-address ${addr}`)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      fontSize: 10.5,
                      fontFamily: 'JetBrains Mono',
                      padding: '5px 8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    {addr}
                  </button>
                ))}
                {(!aiMemory.visitedAddresses || aiMemory.visitedAddresses.length === 0) && (
                  <div style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 4 }}>No wallets tracked yet.</div>
                )}
              </div>
            </div>

            {/* Investigated Transactions */}
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--cyan-400)', fontFamily: 'Space Grotesk', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Audited Tx Hashes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {aiMemory.investigatedTxs?.slice(0, 5).map((tx: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setInputPrompt(`/analyze-tx ${tx}`)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      fontSize: 10.5,
                      fontFamily: 'JetBrains Mono',
                      padding: '5px 8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    {tx}
                  </button>
                ))}
                {(!aiMemory.investigatedTxs || aiMemory.investigatedTxs.length === 0) && (
                  <div style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 4 }}>No hashes tracked yet.</div>
                )}
              </div>
            </div>

            {/* Previous Queries */}
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Session Queries
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {aiMemory.previousQuestions?.slice(0, 4).map((q: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setInputPrompt(q)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      fontSize: 10,
                      padding: '5px 8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Terminal Chat Console */}
      <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1.2px solid var(--border-cyan)' }}>
        
        {/* Terminal Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-1)', background: 'rgba(2, 4, 10, 0.75)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan-400)', boxShadow: 'var(--cyan-glow-sm)' }} />
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '0.05em' }}>COGNITIVE INVESTIGATION SHELL</span>
          </div>
          <button 
            className="btn-ghost" 
            style={{ fontSize: 11, padding: '4px 10px', height: 26 }}
            onClick={() => {
              setMessages([{ role: 'assistant', content: 'Terminal session restarted. Command queue cleared.' }]);
              store.clearAIMemory();
            }}
          >
            <RefreshCw size={12} style={{ marginRight: 4 }} />
            Reset Shell
          </button>
        </div>

        {/* Messages Screen */}
        <div className="nav-scroll" style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#02040a', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  flexDirection: 'column',
                  gap: 4,
                  animation: 'fadeUp 0.2s ease-out',
                }}
              >
                {/* Speaker tag */}
                <div style={{
                  fontSize: 9.5,
                  fontFamily: 'JetBrains Mono',
                  color: isUser ? 'var(--cyan-400)' : 'var(--violet-400)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                }}>
                  {isUser ? (
                    <>
                      SECURE_USER_NODE
                      <ArrowRight size={10} />
                    </>
                  ) : (
                    <>
                      <Cpu size={10} />
                      GEMINI_COGNITIVE_INTELLIGENCE
                    </>
                  )}
                </div>

                {/* Box bubble */}
                <div style={{
                  background: isUser ? 'rgba(0, 245, 255, 0.05)' : 'rgba(5, 8, 18, 0.85)',
                  border: `1px solid ${isUser ? 'rgba(0, 245, 255, 0.15)' : 'rgba(180, 74, 255, 0.15)'}`,
                  padding: '12px 16px',
                  borderRadius: 12,
                  boxShadow: isUser ? 'none' : 'inset 0 0 10px rgba(180, 74, 255, 0.02)',
                  position: 'relative',
                }}>
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyText(msg.content, idx)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-3)',
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'opacity 150ms',
                    }}
                    className="copy-btn-hover"
                  >
                    {copiedIndex === idx ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                  </button>

                  <TerminalMarkdown text={msg.content} />
                </div>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* Quick Macros suggestions bar */}
        <div style={{ padding: '8px 16px', background: 'rgba(5,8,18,0.5)', borderTop: '1px solid var(--border-0)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Audit Laundering Structures', prompt: 'Audit standard laundering topologies: Explain smurfing/structuring, privacy mixer setups, and secondary multi-hop chain evasion vectors.' },
            { label: 'OFAC Sanction Compliance', prompt: 'Detail OFAC compliance requirements regarding sanctioned crypto addresses and tornado cash interactions.' },
            { label: 'Mixer Inflow Profiles', prompt: 'How can blockchain analytics flag transaction flows moving into non-custodial privacy mixers?' },
          ].map((macro, idx) => (
            <button
              key={idx}
              className="btn-ghost"
              style={{ fontSize: 10, padding: '4px 10px', height: 24, cursor: 'pointer' }}
              onClick={() => handleSendPrompt(macro.prompt)}
            >
              {macro.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border-1)', background: 'rgba(2, 4, 10, 0.8)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            style={{ display: 'flex', gap: 10 }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Terminal size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                className="glass-input"
                placeholder="Query Gemini cognitive core..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                style={{ width: '100%', paddingLeft: 36, paddingRight: 12, height: 38, fontSize: 13 }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="btn-primary"
              style={{
                width: 76,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #00f5ff, #b44aff)',
                border: 'none',
                color: '#02040a',
                borderRadius: 8,
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        <style>{`
          .copy-btn-hover:hover {
            opacity: 1 !important;
          }
          div:hover > .copy-btn-hover {
            opacity: 0.6;
          }
        `}</style>
      </div>
    </div>
  );
}
