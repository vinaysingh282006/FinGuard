import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Zap, Send, Trash2, MessageSquare, AlertCircle, BarChart2, Search, Shield } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';

const QUICK_PROMPTS = [
  { icon: AlertCircle,  text: 'Summarize all CRITICAL alerts from the last hour',       color: 'var(--risk-critical)' },
  { icon: BarChart2,   text: 'What patterns suggest structuring or smurfing behavior?',  color: 'var(--risk-high)' },
  { icon: Zap,         text: 'Analyze the highest-risk address in our current dataset',  color: 'var(--violet-400)' },
  { icon: Search,      text: 'Which transactions likely involve sanctioned entities?',   color: 'var(--risk-medium)' },
  { icon: Shield,      text: 'Generate a SAR filing summary for the top 5 flags',        color: 'var(--cyan-500)' },
  { icon: AlertCircle, text: 'Explain the circular transaction pattern detected today',   color: 'var(--risk-critical)' },
  { icon: BarChart2,   text: 'What is the current threat index and what drives it?',     color: 'var(--text-2)' },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--violet-500), var(--cyan-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
          <Zap size={14} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'linear-gradient(135deg, var(--cyan-500), var(--violet-500))' : 'var(--glass-02)',
        border: isUser ? 'none' : '1px solid var(--border-1)',
        color: 'var(--text-1)',
        fontSize: 13,
        fontFamily: 'Inter',
        lineHeight: 1.6,
        boxShadow: 'var(--shadow-2)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--violet-500), var(--cyan-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Zap size={14} color="#fff" />
      </div>
      <div style={{ background: 'var(--glass-02)', border: '1px solid var(--border-1)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px', display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--cyan-500)',
            animation: `dot-bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes dot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

export default function AIAnalyst() {
  const store = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('live');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const prompt = text || input.trim();
    if (!prompt || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const txSummary = store.transactions.slice(0, 10).map(tx =>
        `${tx.chain} | $${Math.floor(tx.valueUsd).toLocaleString()} | Score: ${tx.fraudScore} | ${tx.threatLevel}`
      ).join('\n');

      const systemContext = `You are FinGuard AI, an expert AML and blockchain fraud analyst. You have access to real-time transaction data. Current context: ${context === 'live' ? `Live Feed (${store.transactions.length} txns)\n\nTop transactions:\n${txSummary}` : 'No data uploaded'}. Threat index: ${store.stats?.threatIndex || 42}/100. Answer concisely and professionally.`;

      const aiResponse = await generateAIResponse(`${systemContext}\n\nUser: ${prompt}`);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}. Please check your connection.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 'calc(100vh - 140px)' }}>
      {/* Left: Context Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 12 }}>Data Context</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[['live', 'Live Feed'], ['upload', 'Uploaded'], ['manual', 'Manual']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setContext(val)}
                style={{
                  flex: 1, fontSize: 11, padding: '5px 8px', borderRadius: 6,
                  border: `1px solid ${context === val ? 'var(--border-cyan)' : 'var(--border-1)'}`,
                  background: context === val ? 'var(--cyan-dim)' : 'var(--glass-01)',
                  color: context === val ? 'var(--cyan-400)' : 'var(--text-3)',
                  cursor: 'pointer', fontFamily: 'Inter', fontWeight: context === val ? 600 : 400,
                  transition: 'all 150ms ease'
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ background: 'var(--glass-01)', borderRadius: 8, padding: 10, fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>
            <div style={{ color: 'var(--text-2)', marginBottom: 4, fontFamily: 'Inter', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Context</div>
            {store.transactions.length.toLocaleString()} transactions<br />
            {store.transactions.filter(t => t.fraudScore > 60).length} flagged<br />
            Threat index: {store.stats?.threatIndex || 42}/100
          </div>
        </div>

        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, fontFamily: 'Inter', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>Suggested Prompts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_PROMPTS.map(({ icon: Icon, text, color }, i) => (
              <button
                key={i}
                onClick={() => sendMessage(text)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 10px', borderRadius: 8, textAlign: 'left',
                  background: 'var(--glass-01)', border: '1px solid var(--border-0)',
                  cursor: 'pointer', color: 'var(--text-2)',
                  fontSize: 12, fontFamily: 'Inter', lineHeight: 1.4,
                  transition: 'all 150ms ease', width: '100%'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-03)'; e.currentTarget.style.borderColor = 'var(--border-cyan)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-01)'; e.currentTarget.style.borderColor = 'var(--border-0)'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                <Icon size={13} style={{ color, flexShrink: 0, marginTop: 1 }} />
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Chat Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-0)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--violet-500), var(--cyan-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(124,92,252,0.4)' }}>
            <Zap size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>FinGuard AI Analyst</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Powered by Gemini 1.5 Pro</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="btn-ghost"
              style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: 11 }}
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, var(--violet-500), var(--cyan-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(124,92,252,0.4)' }}>
                <MessageSquare size={28} color="#fff" />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: 'var(--text-1)', marginBottom: 8 }}>Ask FinGuard AI anything</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 400 }}>
                  Analyze transactions, detect patterns, generate compliance reports — all with AI.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 440, width: '100%' }}>
                {QUICK_PROMPTS.slice(0, 4).map(({ icon: Icon, text, color }, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(text)}
                    style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--glass-02)', border: '1px solid var(--border-1)', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-cyan)'; e.currentTarget.style.background = 'var(--glass-03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-1)'; e.currentTarget.style.background = 'var(--glass-02)'; }}
                  >
                    <Icon size={14} style={{ color, marginBottom: 6 }} />
                    <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'Inter', lineHeight: 1.4 }}>{text.substring(0, 50)}...</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && <ThinkingDots />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-0)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about fraud patterns, AML risks, compliance actions..."
              style={{
                width: '100%', height: 44, resize: 'none', padding: '10px 14px',
                background: 'var(--glass-01)', border: '1px solid var(--border-1)',
                borderRadius: 10, color: 'var(--text-1)',
                fontFamily: 'Inter', fontSize: 13, outline: 'none',
                transition: 'border-color 150ms ease',
                boxSizing: 'border-box'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-cyan)'; e.target.style.boxShadow = '0 0 0 3px var(--cyan-dim)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-1)'; e.target.style.boxShadow = 'none'; }}
              disabled={loading}
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{ height: 44, width: 44, justifyContent: 'center', padding: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
