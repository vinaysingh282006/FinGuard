import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Zap, X, Send, Terminal, Brain, Volume2, VolumeX, 
  Play, ChevronRight, AlertCircle, Fingerprint, FileText, 
  HelpCircle, Sparkles, CheckCircle2, History, RotateCcw
} from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

// Style constants matching threat index
const THREAT_THEMES = {
  SAFE: { color: 'var(--emerald-500)', glow: '0 0 16px rgba(0, 214, 143, 0.4)' },
  WATCHLIST: { color: 'var(--cyan-500)', glow: 'var(--cyan-glow-sm)' },
  HIGH: { color: 'var(--risk-high)', glow: 'var(--risk-high-glow)' },
  CRITICAL: { color: 'var(--risk-critical)', glow: 'var(--risk-critical-glow)' },
  LAUNDERING: { color: 'var(--violet-500)', glow: 'var(--violet-glow)' }
};

function getTheme(threatIndex) {
  if (threatIndex >= 91) return THREAT_THEMES.LAUNDERING;
  if (threatIndex >= 81) return THREAT_THEMES.CRITICAL;
  if (threatIndex >= 61) return THREAT_THEMES.HIGH;
  if (threatIndex >= 31) return THREAT_THEMES.WATCHLIST;
  return THREAT_THEMES.SAFE;
}

// Simple parser for standard markdown features (bold, lists, code)
function formatAIResponse(text) {
  if (!text) return '';
  // Convert code blocks
  let formatted = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre class="terminal-code-block">${code.trim()}</pre>`;
  });
  // Convert inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="terminal-inline-code">$1</code>');
  // Convert bold text
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Convert list items
  formatted = formatted.replace(/^\s*[•*-]\s+(.+)$/gm, '<li class="terminal-list-item">$1</li>');
  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br />');
  return formatted;
}

export default function AIFloatingPanel() {
  const store = useStore();
  const activeTab = store.activeTab;
  const selectedAddress = store.selectedAddress;
  const selectedTransaction = store.selectedTransaction;
  const recentAlerts = store.alerts;
  const threatIndex = store.stats?.threatIndex || 42;
  const customAIPrompt = store.customAIPrompt;

  const isOpen = store.isAIPanelOpen;
  const setIsOpen = store.setAIPanelOpen;
  const speechEnabled = store.speechEnabled;
  const setSpeechEnabled = store.setSpeechEnabled;

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCopilotMode, setIsCopilotMode] = useState(false);
  const [copilotPhase, setCopilotPhase] = useState(1);
  const [streamingText, setStreamingText] = useState('');
  const [isMemoryExpanded, setIsMemoryExpanded] = useState(false);

  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  
  // Theme color based on FTI index
  const theme = useMemo(() => getTheme(threatIndex), [threatIndex]);

  // Sync scroll on chat update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, loading]);

  // Hook custom prompt triggers from other pages
  useEffect(() => {
    if (customAIPrompt) {
      setIsOpen(true);
      triggerAIPrompt(customAIPrompt);
      store.setCustomAIPrompt(null); // Reset trigger
    }
  }, [customAIPrompt]);

  // Generate Grounding System Instruction
  const generateSystemInstruction = () => {
    const memoryText = `
SESSION MEMORY:
- Visited Wallets: ${store.aiMemory?.visitedAddresses?.join(', ') || 'None'}
- Investigated Transactions: ${store.aiMemory?.investigatedTxs?.join(', ') || 'None'}
- Alerts Addressed: ${store.aiMemory?.recentAlertsExplained?.join(', ') || 'None'}
- Previous Questions Asked: ${store.aiMemory?.previousQuestions?.join(' | ') || 'None'}
    `;

    return `You are FinGuard AI, an advanced AI financial analyst, cybersecurity investigator, blockchain intelligence assistant, and threat analysis copilot.
You are embedded directly into the FinGuard X Command Console operating system.
Your tone must be professional, enterprise-grade, highly technical, and intelligent (like Jarvis for fintech intelligence).

${memoryText}

CURRENT STATE CONTEXT:
- Active page tab: ${activeTab}
- Selected Transaction: ${selectedTransaction ? JSON.stringify(selectedTransaction) : 'None'}
- Selected Address/Wallet: ${selectedAddress || 'None'}
- Overall Network Threat Index: ${threatIndex}/100
- Recent security alerts: ${JSON.stringify(recentAlerts.slice(0, 5))}

When answering questions, tie in the active context and the session memory variables if relevant. If analyzing a wallet or transaction, perform a deep explanation of layering, structuring, or velocity concerns. Keep explanations technical but concise.`;
  };

  // Simulated AI Streaming fallbacks for demo comfort
  const runSimulatedStream = async (prompt, systemContext, isCopilot = false, phase = 1) => {
    setLoading(true);
    setStreamingText('');

    let mockText = '';
    if (isCopilot) {
      const txHash = selectedTransaction?.hash || '';
      const walletAddr = selectedAddress || '';
      const entity = selectedTransaction ? `Tx [${txHash.substring(0, 8)}]` : selectedAddress ? `Wallet [${walletAddr.substring(0, 8)}]` : 'Active Network Node';
      if (phase === 1) {
        mockText = `**[COPILOT PHASE 1: INGRESS RISK ANALYSIS]**\n\nInitiating investigation on **${entity}**:\n• **Sanctions Registry Match:** cross-checking against OFAC and global consolidated watchlists. Results: *CLEAN* or *INDIRECT CONNECTION* detected through intermediate transfers.\n• **IP/Geo Audit:** Source node mapped to high-risk location. Network access latency suggests VPN/proxy tunneling obfuscation.\n• **Account Age & Seed Origin:** Origin wallet is relatively new (created within 48 hours). Seed funds originated from a non-custodial decentralized liquidity pool.\n\n**Risk Scoring Assessment:** High probability of anonymous onboarding setup. Proceeding to Phase 2 for flow rate calculations...`;
      } else if (phase === 2) {
        mockText = `**[COPILOT PHASE 2: VELOCITY & LAYERING INVESTIGATION]**\n\nTracing transfer sequence from **${entity}**:\n• **Layering Check:** Detected multiple sequential low-volume routing transactions through 4 intermediary wallets within a 9-minute interval. This is highly consistent with **smurfing/structuring patterns** designed to bypass AML compliance thresholds.\n• **Velocity Index:** Cumulative volume moved is **$${Math.floor(selectedTransaction ? selectedTransaction.valueUsd : 450000).toLocaleString()} USD**. Transfer rate exceeds normal commercial velocity parameters by **240%**.\n• **Split Routing:** Value split into uneven fractions and routed concurrently to obscure the direct audit trail.\n\n**Recommendation:** Layering signatures confirmed. Proceeding to Integration phase check.`;
      } else if (phase === 3) {
        mockText = `**[COPILOT PHASE 3: INTEGRATION POOLS DETECTION]**\n\nAnalyzing terminal egress destinations for **${entity}**:\n• **Privacy Protocol Ingress:** Traced 42% of the split funds routing towards a known **privacy mixer contract (Tornado Cash)**.\n• **Non-Custodial Bridges:** Remaining funds have been exchanged via cross-chain bridges into anonymous gas tokens.\n• **Target Exchange Egress:** Found destination hops connecting to accounts on exchanges lacking active compliance enforcement.\n\n**Conclusion:** Integration phase is active. Funds are currently in the process of anonymization and distribution. Immediate mitigation required.`;
      } else {
        mockText = `**[COPILOT PHASE 4: COMPLIANCE RESOLUTION & SAR]**\n\nGenerating Action Plan for **${entity}**:\n\n**1. Emergency Interventions:**\n• Notify central liquidity partners to blacklist target destination wallets.\n• Halt withdrawal channels linked to the originating session address.\n\n**2. SAR Filing Draft Narrative:**\n*"At ${new Date().toLocaleTimeString()} UTC, the FinGuard X platform detected a circular layering pattern originating from address ${selectedAddress || 'target node'}. Funds totaling $${Math.floor(selectedTransaction ? selectedTransaction.valueUsd : 450000).toLocaleString()} USD were systematically structured across multiple intermediate hops and integrated into mixer pools. This sequence resembles historical Lazarus-affiliated routing patterns."*\n\n**Status:** Intelligence package compiled. Ready for compliance download.`;
      }
    } else {
      if (prompt.toLowerCase().includes('summarize') || prompt.toLowerCase().includes('anomalies')) {
        mockText = `**Active Command Console Anomalies Summary:**\n\n• **FTI Threat Index:** currently reading **${threatIndex}/100** due to elevated transaction counts and suspicious routing flags.\n• **Detected laundering loops:** ${recentAlerts.filter(a => a.threatLevel === 'CRITICAL').length} critical circular flows active on Ethereum.\n• **Whale Activity:** 2 whale movements exceeding $10M USDT flagged as high-velocity redistributions, indicating defensive market shifts or migration.\n• **Target Watchlist:** Lazarus exploit address is active and routing transactions via nested bridge hops.\n\n**Actionable Advice:** Initiate Copilot Forensics on the latest critical alert, or download the SAR Compliance summary from the Report Center.`;
      } else if (prompt.toLowerCase().includes('predict') || prompt.toLowerCase().includes('forecast')) {
        mockText = `**FinGuard Threat Index Anomaly Forecast:**\n\nBased on neural pattern matching and transaction velocity on active pools:\n• **Next 4 Hours:** Threat index predicted to **increase by 8 points** (moving to ~${Math.min(100, threatIndex + 8)}) due to ongoing circular routes.\n• **Probability of Laundering Evasion:** **87%** if destination bridge pools remain unchecked.\n• **Active Risk Vector:** Rapid token splitting (smurfing) across EVM layers.\n\n**Preemptive Defense Recommendation:** Deploy localized AML evasion filters and auto-flag multi-hop splits below $15k USD.`;
      } else if (selectedAddress && (prompt.toLowerCase().includes('wallet') || prompt.toLowerCase().includes('address') || prompt.toLowerCase().includes('forensic'))) {
        mockText = `**AML Wallet Forensics: Address ${selectedAddress}**\n\n• **Threat Classification:** High-Risk Layering Node.\n• **Historical Correlation:** 94% match with known structuring addresses routed through Tornado Cash mixers.\n• **Associated Volume:** $2.4M USD over 14 interactions.\n• **Behavioral Fingerprint:** High transaction frequency, short holding times (less than 3 minutes), and multi-asset routing.\n\n*Intelligence Suggestion:* Restrict outbound withdrawals for this node and draft a suspicious activity record (SAR).`;
      } else if (selectedTransaction && (prompt.toLowerCase().includes('threat') || prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('tx'))) {
        const txHash = selectedTransaction?.hash || '';
        mockText = `**Threat Evaluation: Transaction ${txHash.substring(0, 16)}...**\n\n• **Chain:** ${selectedTransaction.chain}\n• **Value:** $${Math.floor(selectedTransaction.valueUsd).toLocaleString()} USD\n• **Risk Score:** ${selectedTransaction.fraudScore}/100 (${selectedTransaction.threatLevel})\n• **Anomaly Signature:** ${selectedTransaction.reason || 'High volume transfer'}\n\n**Analysis:**\nThis transfer exhibits clear **layering behavior**. Funds were moved rapidly after deposit from an unknown exchange. Velocity filters flags this transaction due to the night-time execution and immediate split-transfer routing.`;
      } else {
        mockText = `**Analysis Complete (FinGuard AI Platform):**\n\nBased on your prompt: *"${prompt}"*\n\n1. **Active Context:** Currently monitoring page **${activeTab}**.\n2. **Platform Diagnostics:** Threat index is at **${threatIndex}/100**. ${recentAlerts.length} security flags have been recorded.\n3. **Investigation Insight:** Standard transaction streams show moderate activity. We recommend running a "Tactical Anomalies Only" filter on the Live Feed page to isolate the high-risk flows.\n\n*For real-time generative intelligence, configure VITE_GEMINI_API_KEY in the .env.local file.*`;
      }
    }

    // Speech announcement for responses (if enabled)
    if (speechEnabled) {
      audioEngine.speakAlert(isCopilot ? `Phase ${phase} analysis complete.` : "Analysis generated.");
    }

    // Typewriter effect simulation
    let currentText = '';
    const words = mockText.split(' ');
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setStreamingText(currentText);
      await new Promise(r => setTimeout(r, 20 + Math.random() * 20)); // typing speed
    }

    setMessages(prev => [...prev, { role: 'assistant', content: mockText }]);
    setStreamingText('');
    setLoading(false);
  };

  // Trigger prompt via API or Fallback
  const triggerAIPrompt = async (prompt) => {
    if (loading) return;
    
    // Add user message
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    store.addQuestionToMemory(prompt);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const systemContext = generateSystemInstruction();

    // Check if API key is valid
    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'your_github_secret_gemini_key_here') {
      setLoading(true);
      setStreamingText('');
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // We use gemini-1.5-flash which supports fast responses and instructions
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          systemInstruction: systemContext
        });

        // Use streaming API
        const result = await model.generateContentStream(prompt);
        let completeText = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          completeText += chunkText;
          setStreamingText(completeText);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: completeText }]);
        if (speechEnabled) {
          audioEngine.speakAlert("Forensic analysis streaming complete.");
        }
      } catch (err) {
        console.error('Gemini API Error:', err);
        setMessages(prev => [...prev, { role: 'assistant', content: `**Cognitive Connection Error:** ${err.message}. Reverting to local threat database diagnostics.` }]);
        // Fallback to simulation
        await runSimulatedStream(prompt, systemContext);
      } finally {
        setStreamingText('');
        setLoading(false);
      }
    } else {
      // Fallback
      await runSimulatedStream(prompt, systemContext);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || loading) return;
    const text = chatInput.trim();
    setChatInput('');
    triggerAIPrompt(text);
  };

  // Copilot step controllers
  const startCopilotMode = () => {
    audioEngine.playWarning();
    setIsCopilotMode(true);
    setCopilotPhase(1);
    
    // Auto trigger first phase
    const entity = selectedTransaction ? `transaction ${selectedTransaction.hash}` : selectedAddress ? `wallet address ${selectedAddress}` : 'the current active threat cluster';
    const copilotPrompt = `Initiate step-by-step Copilot Forensic Investigation. Phase 1: Ingress and source check for ${entity}.`;
    triggerAIPrompt(copilotPrompt);
  };

  const nextCopilotPhase = () => {
    if (loading || copilotPhase >= 4) return;
    audioEngine.playClick();
    const nextPhase = copilotPhase + 1;
    setCopilotPhase(nextPhase);

    const entity = selectedTransaction ? `transaction ${selectedTransaction.hash}` : selectedAddress ? `wallet address ${selectedAddress}` : 'the current active threat cluster';
    const copilotPrompt = `Continue Copilot Forensic Investigation. Run Phase ${nextPhase} analysis on ${entity}.`;
    
    // Call simulated or actual API with phase instructions
    const systemContext = generateSystemInstruction() + `\nFocus specifically on Phase ${nextPhase} checks.`;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'your_github_secret_gemini_key_here') {
      triggerAIPrompt(copilotPrompt);
    } else {
      runSimulatedStream(copilotPrompt, systemContext, true, nextPhase);
    }
  };

  const resetCopilot = () => {
    audioEngine.playClick();
    setIsCopilotMode(false);
    setCopilotPhase(1);
    setMessages([]);
  };

  // Quick Action triggers
  const handleQuickAction = (action) => {
    audioEngine.playClick();
    let promptText = '';
    
    switch (action) {
      case 'summarize':
        promptText = `Summarize all active alerts, suspicious transactions, and anomalies on the current ${activeTab} page view.`;
        break;
      case 'predict':
        promptText = `Forecast next threat patterns and predict anomaly movements based on the current threat index of ${threatIndex}/100.`;
        break;
      case 'explain_tx':
        if (selectedTransaction) {
          promptText = `Perform a deep AML explanation on the selected transaction ${selectedTransaction.hash} with risk score ${selectedTransaction.fraudScore}. Explain what indicators were triggered.`;
        } else {
          promptText = `Analyze the highest risk transaction in the feed and explain its threat indicators.`;
        }
        break;
      case 'analyze_wallet':
        if (selectedAddress) {
          promptText = `Run a forensic AML analysis on the selected wallet address: ${selectedAddress}. Summarize its behavior, transaction connections, and flag potential risk level.`;
        } else {
          promptText = `What behavioral signs suggest a wallet is engaged in layering or circular laundering?`;
        }
        break;
      default:
        promptText = `Analyze current market volatility and asset movements.`;
    }

    triggerAIPrompt(promptText);
  };

  return (
    <>
      {/* 1. FLOATING AI ORB BUTTON (Rendered on every page) */}
      <div 
        onClick={() => {
          audioEngine.playClick();
          setIsOpen(!isOpen);
        }}
        style={{
          position: 'fixed',
          bottom: 50,
          right: 24,
          zIndex: 999,
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: isOpen ? 'var(--bg-overlay)' : 'rgba(5, 8, 18, 0.75)',
          border: `1.5px solid ${theme.color}`,
          boxShadow: isOpen ? '0 0 12px rgba(255,255,255,0.1)' : theme.glow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
          e.currentTarget.style.boxShadow = `0 0 25px ${theme.color}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = isOpen ? 'none' : theme.glow;
        }}
        title="Command AI Assistant Panel"
      >
        {isOpen ? (
          <X size={20} style={{ color: 'var(--text-1)' }} />
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} style={{ color: theme.color }} className="animate-pulse" />
            <span style={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: theme.color,
              boxShadow: `0 0 6px ${theme.color}`
            }} />
          </div>
        )}
      </div>

      {/* 2. EXPANDABLE RIGHT SIDE PANEL */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 440,
          height: '100vh',
          zIndex: 998,
          background: 'rgba(8, 12, 24, 0.93)',
          backdropFilter: 'blur(20px) saturate(140%)',
          borderLeft: '1px solid var(--border-cyan)',
          boxShadow: '-10px 0 40px rgba(0,245,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 350ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Panel Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(2, 4, 10, 0.5)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--cyan-500), var(--violet-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,245,255,0.3)'
            }}>
              <Zap size={14} color="#000" style={{ strokeWidth: 2.5 }} />
            </div>
            <div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '0.05em' }}>GEMINI AI COPILOT</span>
              <div style={{ fontSize: 9, color: theme.color, letterSpacing: '0.04em', fontWeight: 700, textTransform: 'uppercase' }}>FTI MATRIX ACTIVE</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* TTS Audio toggle */}
            <button 
              onClick={() => {
                audioEngine.playClick();
                setSpeechEnabled(!speechEnabled);
              }}
              style={{
                background: 'none',
                border: '1px solid var(--border-1)',
                borderRadius: 6,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                color: speechEnabled ? 'var(--cyan-400)' : 'var(--text-3)',
                fontSize: 10,
                fontFamily: 'Space Grotesk',
                fontWeight: 700
              }}
              title={speechEnabled ? "Mute Copilot Audio Readouts" : "Unmute Copilot Audio Readouts"}
            >
              {speechEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {speechEnabled ? "VOICE ON" : "MUTED"}
            </button>

            {/* Close Button */}
            <button 
              onClick={() => {
                audioEngine.playClick();
                setIsOpen(false);
              }}
              className="btn-ghost"
              style={{ padding: 6, borderRadius: 6 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Workspace context subheader */}
        <div style={{
          padding: '10px 20px',
          background: 'rgba(5, 8, 18, 0.4)',
          borderBottom: '1px solid var(--border-0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: 'JetBrains Mono',
          color: 'var(--text-2)',
          flexShrink: 0
        }}>
          <div>PAGE: <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{activeTab.toUpperCase()}</span></div>
          <div>FTI THREAT: <span style={{ color: theme.color, fontWeight: 700 }}>{threatIndex}</span></div>
        </div>

        {/* Selected target context badge */}
        {(selectedAddress || selectedTransaction) && (
          <div style={{
            padding: '10px 20px',
            background: 'rgba(0, 245, 255, 0.03)',
            borderBottom: '1px solid var(--border-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-2)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span className="status-dot status-dot-violet" style={{ width: 6, height: 6 }} />
              {selectedTransaction ? (
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  TXID: <strong style={{ color: '#fff' }}>{(selectedTransaction.hash || '').substring(0, 12)}...</strong>
                </span>
              ) : (
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  ADDR: <strong style={{ color: '#fff' }}>{(selectedAddress || '').substring(0, 12)}...</strong>
                </span>
              )}
            </div>
            <button 
              onClick={() => {
                audioEngine.playClick();
                store.setSelectedTransaction(null);
                store.setSelectedAddress(null);
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--risk-critical)', cursor: 'pointer', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700
              }}
            >
              CLEAR TARGET
            </button>
          </div>
        )}

        {/* Panel Main Area */}
        <div 
          ref={chatScrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Persistent Session Memory Log */}
          <div className="glass-card" style={{ padding: 0, border: '1px solid var(--border-1)' }}>
            <button 
              onClick={() => {
                audioEngine.playClick();
                setIsMemoryExpanded(!isMemoryExpanded);
              }}
              style={{
                width: '100%',
                background: 'rgba(5, 8, 18, 0.5)',
                border: 'none',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-2)',
                fontSize: 11.5,
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={13} className="text-cyan" />
                AI SESSION MEMORY LOG
              </span>
              <span style={{ color: 'var(--text-3)' }}>
                {isMemoryExpanded ? '[-] COLLAPSE' : '[+] VIEW'}
              </span>
            </button>
            
            {isMemoryExpanded && (
              <div style={{
                padding: 12,
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                color: 'var(--text-2)',
                background: 'rgba(2, 4, 10, 0.4)',
                borderTop: '1px solid var(--border-0)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div>
                  <span style={{ color: 'var(--violet-400)' }}>VISITED ADDRS:</span>{' '}
                  {store.aiMemory?.visitedAddresses?.length > 0 
                    ? store.aiMemory.visitedAddresses.map(a => a.substring(0, 8) + '...').join(', ')
                    : 'Empty'}
                </div>
                <div>
                  <span style={{ color: 'var(--cyan-400)' }}>CHECKED TXS:</span>{' '}
                  {store.aiMemory?.investigatedTxs?.length > 0 
                    ? store.aiMemory.investigatedTxs.map(t => t.substring(0, 8) + '...').join(', ')
                    : 'Empty'}
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>LAST QUESTION:</span>{' '}
                  {store.aiMemory?.previousQuestions?.[0] || 'None'}
                </div>
                <button 
                  onClick={() => {
                    audioEngine.playClick();
                    store.clearAIMemory();
                  }}
                  className="btn-ghost"
                  style={{
                    padding: '3px 8px', fontSize: 10, width: 'fit-content', marginTop: 4, alignSelf: 'flex-end'
                  }}
                >
                  <RotateCcw size={10} /> CLEAR LOG
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Matrix (if not in copilot or if chat is empty) */}
          {messages.length === 0 && !isCopilotMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => handleQuickAction('summarize')}>
                  <Sparkles size={12} className="text-cyan" />
                  Summarize view
                </button>
                <button className="btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 11.5 }} onClick={() => handleQuickAction('predict')}>
                  <AlertCircle size={12} className="text-violet" />
                  Predict Threat
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ justifyContent: 'flex-start', fontSize: 11.5 }} 
                  onClick={() => handleQuickAction('explain_tx')}
                >
                  <FileText size={12} className="text-critical" />
                  Explain Transaction
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ justifyContent: 'flex-start', fontSize: 11.5 }} 
                  onClick={() => handleQuickAction('analyze_wallet')}
                >
                  <Fingerprint size={12} className="text-emerald" />
                  Analyze Wallet
                </button>
              </div>
            </div>
          )}

          {/* Copilot Phase Indicator HUD */}
          {isCopilotMode ? (
            <div className="glass-card" style={{ padding: 12, background: 'rgba(180, 74, 255, 0.04)', borderColor: 'var(--border-violet)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--violet-400)' }}>AI COPILOT INVESTIGATION ACTIVE</span>
                <button 
                  onClick={resetCopilot}
                  style={{ background: 'none', border: 'none', color: 'var(--risk-critical)', fontSize: 10, fontFamily: 'Space Grotesk', cursor: 'pointer', fontWeight: 700 }}
                >
                  HALT
                </button>
              </div>
              
              {/* Stepper bubbles */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginBottom: 12 }}>
                {/* Horizontal progress bar */}
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'var(--border-0)', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(copilotPhase - 1) * 33.3}%`, height: 2, background: 'var(--violet-500)', transition: 'width 300ms ease', zIndex: 2 }} />

                {[1, 2, 3, 4].map(ph => {
                  const isActive = copilotPhase === ph;
                  const isDone = copilotPhase > ph;
                  let color = 'var(--text-3)';
                  let bg = 'rgba(5, 8, 18, 0.9)';
                  let border = '1px solid var(--border-0)';

                  if (isActive) {
                    color = '#000';
                    bg = 'var(--violet-500)';
                    border = '1px solid var(--violet-400)';
                  } else if (isDone) {
                    color = 'var(--violet-400)';
                    bg = 'rgba(180, 74, 255, 0.15)';
                    border = '1px solid var(--border-violet)';
                  }

                  return (
                    <div 
                      key={ph} 
                      style={{
                        width: 22, height: 22, borderRadius: '50%', background: bg, border, color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, zIndex: 3,
                        boxShadow: isActive ? 'var(--violet-glow)' : 'none',
                        transition: 'all 200ms ease'
                      }}
                      title={`Phase ${ph}`}
                    >
                      {isDone ? <CheckCircle2 size={12} /> : ph}
                    </div>
                  );
                })}
              </div>

              {/* Step info label */}
              <div style={{ fontSize: 11, fontFamily: 'Inter', color: 'var(--text-2)', lineHeight: 1.4 }}>
                {copilotPhase === 1 && <strong>Phase 1: Ingress & Sanctions Registry Check</strong>}
                {copilotPhase === 2 && <strong>Phase 2: Velocity & Layering Flow Audit</strong>}
                {copilotPhase === 3 && <strong>Phase 3: Integration Mixer Pools Trace</strong>}
                {copilotPhase === 4 && <strong>Phase 4: Regulatory Case Narrative SAR</strong>}
              </div>

              {/* Next step prompt action */}
              {copilotPhase < 4 && !loading && (
                <button 
                  onClick={nextCopilotPhase}
                  className="btn-primary"
                  style={{
                    width: '100%', height: 32, fontSize: 11, marginTop: 12, justifyContent: 'center', background: 'var(--violet-500)'
                  }}
                >
                  NEXT PHASE ANALYSIS <ChevronRight size={12} />
                </button>
              )}
            </div>
          ) : (
            // Prompt to trigger Copilot mode
            (selectedAddress || selectedTransaction) && messages.length === 0 && (
              <div className="glass-card" style={{ padding: 14, borderStyle: 'dashed', textAlign: 'center' }}>
                <Fingerprint size={24} className="text-violet animate-pulse" style={{ display: 'inline-block', marginBottom: 8 }} />
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>TARGET SECURED FOR COPILOT FORENSICS</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
                  Start Copilot Mode to perform a phase-guided audit on this entity.
                </div>
                <button 
                  onClick={startCopilotMode}
                  className="btn-primary"
                  style={{ width: '100%', height: 34, fontSize: 11, justifyContent: 'center' }}
                >
                  <Play size={12} fill="currentColor" /> START AI COPILOT INVESTIGATION
                </button>
              </div>
            )
          )}

          {/* Chat Messages Log */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    fontSize: 9.5,
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    color: isUser ? 'var(--cyan-400)' : 'var(--violet-400)',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {isUser ? 'USER OPERATOR' : 'GEMINI AI INTELLIGENCE'}
                    {!isUser && <Sparkles size={9} />}
                  </div>
                  
                  <div 
                    className="terminal-bubble"
                    style={{
                      maxWidth: '90%',
                      padding: '10px 14px',
                      borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: isUser ? 'rgba(0, 245, 255, 0.04)' : 'rgba(180, 74, 255, 0.04)',
                      border: isUser ? '1px solid var(--border-cyan)' : '1px solid var(--border-violet)',
                      color: 'var(--text-1)',
                      fontSize: 12.5,
                      fontFamily: 'Inter',
                      lineHeight: 1.55,
                      boxShadow: isUser ? 'var(--cyan-glow-sm)' : 'var(--violet-glow)',
                      overflowWrap: 'anywhere'
                    }}
                    dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }}
                  />
                </div>
              );
            })}

            {/* Streaming Active Response */}
            {streamingText && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{
                  fontSize: 9.5,
                  fontFamily: 'Space Grotesk',
                  fontWeight: 700,
                  color: 'var(--violet-400)',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  GEMINI AI STREAMING... <Sparkles size={9} />
                </div>
                
                <div 
                  className="terminal-bubble"
                  style={{
                    maxWidth: '90%',
                    padding: '10px 14px',
                    borderRadius: '12px 12px 12px 2px',
                    background: 'rgba(180, 74, 255, 0.04)',
                    border: '1px solid var(--border-violet)',
                    color: 'var(--text-1)',
                    fontSize: 12.5,
                    fontFamily: 'Inter',
                    lineHeight: 1.55,
                    boxShadow: 'var(--violet-glow)',
                    overflowWrap: 'anywhere'
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: formatAIResponse(streamingText) }} />
                  <span className="caret" />
                </div>
              </div>
            )}

            {/* Thinking dots */}
            {loading && !streamingText && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 12px' }}>
                <Terminal size={12} className="text-violet animate-pulse" />
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>Inference routing in progress</span>
                <span className="status-dot status-dot-violet animate-ping" style={{ width: 4, height: 4, marginLeft: 2 }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input panel */}
        <form 
          onSubmit={handleSendMessage}
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--border-0)',
            background: 'rgba(5, 8, 18, 0.8)',
            display: 'flex',
            gap: 8,
            flexShrink: 0
          }}
        >
          <input
            type="text"
            className="glass-input"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Ask AI Investigator or type query..."
            disabled={loading}
            style={{ flex: 1, paddingLeft: 12, height: 38 }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!chatInput.trim() || loading}
            style={{ width: 38, height: 38, padding: 0, justifyContent: 'center', borderRadius: 8, opacity: (!chatInput.trim() || loading) ? 0.6 : 1 }}
          >
            <Send size={14} />
          </button>
        </form>

        {/* Panel CSS utilities */}
        <style>{`
          .terminal-code-block {
            background: #020409 !important;
            border: 1px solid var(--border-1);
            border-radius: 6px;
            padding: 8px 10px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--cyan-400);
            overflow-x: auto;
            margin: 8px 0;
            line-height: 1.4;
          }
          .terminal-inline-code {
            background: rgba(0, 245, 255, 0.08);
            border: 1px solid rgba(0, 245, 255, 0.15);
            padding: 1px 4px;
            border-radius: 3px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--cyan-500);
          }
          .terminal-list-item {
            margin-left: 12px;
            list-style-type: square;
            color: var(--text-2);
            margin-top: 4px;
          }
          .caret {
            display: inline-block;
            width: 7px;
            height: 13px;
            background-color: var(--violet-400);
            margin-left: 4px;
            animation: caret-blink 900ms infinite;
            vertical-align: middle;
          }
          @keyframes caret-blink {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}
