import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ShieldAlert, Zap, ArrowRight, DollarSign, Clock, Layers } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { audioEngine } from '../services/audioEngine';

// Forensic trace scenarios
const REPLAY_SCENARIOS = [
  {
    id: 'lazarus_layering',
    title: 'Lazarus Group Layering Attack',
    description: 'Exploit cash-out using rapid address-splitting and Tornado Cash obfuscation.',
    risk: 'critical',
    chain: 'ETH',
    totalValue: 12400000,
    steps: [
      {
        stage: 'Stage 1: Initial Exploit (Staging)',
        desc: 'Exploit smart contract drained of $12.4M USDT. Funds transferred to primary hacker holding address.',
        from: '0xUniswapExploitContract',
        to: '0xLazarusHoldings_Primary',
        valueUsd: 12400000,
        rulesTriggered: ['Exploit Contract Interaction', 'Critical Volume ($1M+)'],
        timeOffset: 'T+00:00'
      },
      {
        stage: 'Stage 2: Layering (Splitting)',
        desc: 'Holdings split into 5 newly deployed distributor addresses in parallel to bypass exchange thresholds.',
        from: '0xLazarusHoldings_Primary',
        to: 'Distributors [0x62aB...1a4F, 0x8df2...d3E1, +3]',
        valueUsd: 2480000,
        rulesTriggered: ['Rapid Split / Smurfing Pattern', 'High Velocity Activity'],
        timeOffset: 'T+02:14'
      },
      {
        stage: 'Stage 3: Secondary Structuring (Smurfing)',
        desc: 'Addresses transfer structured blocks of $9,800 USDT across 12 intermediary addresses.',
        from: 'Distributors [0x62aB...1a4F, etc.]',
        to: 'Intermediaries [0x501C...e221, etc.]',
        valueUsd: 9800,
        rulesTriggered: ['Structured Transfer (Smurfing)', 'Under-threshold Structuring'],
        timeOffset: 'T+03:40'
      },
      {
        stage: 'Stage 4: Privacy Mixer Integration',
        desc: 'Funds routed immediately into Tornado Cash pool. Evasion attempt in progress.',
        from: 'Intermediaries [0x501C...e221, etc.]',
        to: 'Tornado Cash Pool [0x905A...C6B]',
        valueUsd: 12050000,
        rulesTriggered: ['Mixer Deposit/Withdrawal', 'Active Money Laundering'],
        timeOffset: 'T+04:12'
      },
      {
        stage: 'Stage 5: Final Aggregation (Cashout)',
        desc: 'Funds withdrawn via fresh privacy wallets to secondary OTC markets in Dubai.',
        from: 'Tornado Cash Pool [0x905A...C6B]',
        to: 'OTC Custodian [0xDubaiOTC_Evasion]',
        valueUsd: 11980000,
        rulesTriggered: ['Sanction Evasion Egress', 'Flagged OFAC Cashout'],
        timeOffset: 'T+07:45'
      }
    ]
  },
  {
    id: 'phishing_circular',
    title: 'High-Volume Circular Loop Evader',
    description: 'Suspicious wash trading network looping assets back to originator.',
    risk: 'high',
    chain: 'SOL',
    totalValue: 4800000,
    steps: [
      {
        stage: 'Stage 1: Staging Base',
        desc: 'Asset injection of 22,000 SOL into staging account from unknown exchange.',
        from: 'UnknownExchange_Gate4',
        to: '0xSolHolder_A',
        valueUsd: 4800000,
        rulesTriggered: ['High Volume ($250k+)'],
        timeOffset: 'T+00:00'
      },
      {
        stage: 'Stage 2: Hop 1 Evasion',
        desc: 'Immediate transfer to secondary wallet with no prior history.',
        from: '0xSolHolder_A',
        to: '0xSolIntermediate_B',
        valueUsd: 4799000,
        rulesTriggered: ['High Velocity', 'Fresh Account Hop'],
        timeOffset: 'T+00:08'
      },
      {
        stage: 'Stage 3: Hop 2 Evasion',
        desc: 'Secondary transfer to third node, peeling off 100 SOL fee.',
        from: '0xSolIntermediate_B',
        to: '0xSolIntermediate_C',
        valueUsd: 4699000,
        rulesTriggered: ['Multi-hop Routing Chain'],
        timeOffset: 'T+00:15'
      },
      {
        stage: 'Stage 4: Loop Closure',
        desc: 'Asset returns to initial originator wallet, creating circular wash pattern.',
        from: '0xSolIntermediate_C',
        to: '0xSolHolder_A',
        valueUsd: 4698500,
        rulesTriggered: ['Circular Loop Detected', 'Wash Trade Heuristic'],
        timeOffset: 'T+00:22'
      }
    ]
  }
];

export default function ThreatReplay() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x

  const scenario = REPLAY_SCENARIOS[activeScenarioIdx];
  const steps = scenario.steps;

  // Handles auto-playing steps
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 3000 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        audioEngine.playWarning();
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, steps.length, playbackSpeed]);

  const handleStepClick = (idx) => {
    audioEngine.playClick();
    setCurrentStep(idx);
  };

  const togglePlay = () => {
    audioEngine.playClick();
    if (!isPlaying && currentStep === steps.length - 1) {
      // Loop reset
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    audioEngine.playClick();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    audioEngine.playClick();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    audioEngine.playClick();
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* Left panel: Scenario selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        
        {/* Scenarios Header */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--cyan-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} />
            Replay Timelines
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REPLAY_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => {
                  audioEngine.playClick();
                  setActiveScenarioIdx(idx);
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: activeScenarioIdx === idx ? 'linear-gradient(135deg, rgba(0, 245, 255, 0.08), rgba(180, 74, 255, 0.08))' : 'rgba(5, 8, 18, 0.4)',
                  border: `1px solid ${activeScenarioIdx === idx ? 'var(--border-cyan)' : 'var(--border-0)'}`,
                  color: 'var(--text-1)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{sc.title}</span>
                  <span className={`badge ${sc.risk === 'critical' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: 8 }}>{sc.risk}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-2)', lineHeight: 1.3 }}>{sc.description}</div>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--cyan-400)', marginTop: 8 }}>
                  Flow Value: ${Math.floor(sc.totalValue / 1000000)}M {sc.chain}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tactical rules triggered panel */}
        <div className="glass-card" style={{ padding: 16, flex: 1 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={14} className="text-critical" />
            Active Step Heuristics
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps[currentStep].rulesTriggered.map((rule, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 0, 64, 0.04)',
                border: '1px solid rgba(255, 0, 64, 0.15)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 11.5,
                color: 'var(--risk-critical)',
                fontFamily: 'Inter',
                fontWeight: 600
              }}>
                <Zap size={12} style={{ flexShrink: 0 }} />
                {rule}
              </div>
            ))}
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border-0)', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Time Log</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)', fontFamily: 'JetBrains Mono' }}>
                <Clock size={12} />
                {steps[currentStep].timeOffset} from launch
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right panel: Timeline player */}
      <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Scenario info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-1)', paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: '#fff' }}>{scenario.title}</h2>
              <span className={`status-dot status-dot-${scenario.risk === 'critical' ? 'red' : 'violet'}`} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-2)' }}>{scenario.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase' }}>Target Asset</div>
            <div style={{ fontSize: 15, fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--cyan-400)' }}>
              {scenario.chain} | {formatCurrency(scenario.totalValue)}
            </div>
          </div>
        </div>

        {/* Step-by-step trace progress line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '20px 24px 40px', padding: 0 }}>
          {/* Background trace line */}
          <div style={{
            position: 'absolute',
            top: 15,
            left: 0,
            right: 0,
            height: 2,
            background: 'var(--border-1)',
            zIndex: 1
          }} />
          
          {/* Animated active path line */}
          <div style={{
            position: 'absolute',
            top: 15,
            left: 0,
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            height: 2,
            background: 'var(--cyan-500)',
            boxShadow: 'var(--cyan-glow-sm)',
            zIndex: 2,
            transition: 'width 250ms ease'
          }} />

          {steps.map((st, idx) => {
            const isActive = idx === currentStep;
            const isPassed = idx < currentStep;
            const borderCol = isActive ? 'var(--cyan-500)' : isPassed ? 'var(--violet-500)' : 'var(--border-1)';
            const bg = isActive ? 'var(--cyan-dim)' : isPassed ? 'rgba(180, 74, 255, 0.1)' : '#02040a';
            const shadow = isActive ? 'var(--cyan-glow-sm)' : 'none';
            return (
              <button
                key={idx}
                onClick={() => handleStepClick(idx)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${borderCol}`,
                  background: bg,
                  boxShadow: shadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 200ms ease',
                  position: 'relative'
                }}
              >
                <span style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? 'var(--cyan-500)' : isPassed ? 'var(--violet-400)' : 'var(--text-3)'
                }}>{idx + 1}</span>

                {/* Micro Label */}
                <div style={{
                  position: 'absolute',
                  top: 38,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Space Grotesk',
                  fontSize: 9,
                  fontWeight: 700,
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {st.timeOffset}
                </div>
              </button>
            );
          })}
        </div>

        {/* Animated Money Flow Diagram for current step */}
        <div style={{
          flex: 1,
          background: 'rgba(2, 4, 10, 0.4)',
          border: '1px solid var(--border-1)',
          borderRadius: 10,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 16
        }}>
          {/* Scanner Overlay grid */}
          <div className="cyber-grid" style={{ opacity: 0.3 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 10 }}>
            {/* Sender Node */}
            <div style={{
              background: 'rgba(5, 8, 18, 0.9)',
              border: '1px solid var(--border-cyan)',
              borderRadius: 8,
              padding: '12px 16px',
              textAlign: 'center',
              boxShadow: 'var(--cyan-glow-sm)',
              width: 170
            }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase' }}>SOURCE NODE</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                {steps[currentStep].from}
              </div>
            </div>

            {/* Connecting Flow Line with moving beam */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: 140 }}>
              <div style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--risk-critical)',
                textShadow: '0 0 6px rgba(255,0,64,0.4)',
                marginBottom: 6
              }}>
                {formatCurrency(steps[currentStep].valueUsd)}
              </div>
              <div style={{
                width: '100%',
                height: 2,
                background: 'linear-gradient(90deg, var(--cyan-500), var(--violet-500))',
                position: 'relative'
              }}>
                {/* Moving glowing particle */}
                <div style={{
                  position: 'absolute',
                  top: -3,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 10px #fff, 0 0 20px var(--cyan-500)',
                  animation: 'replay-flow-beam 1.5s infinite linear'
                }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowRight size={10} />
                Asset Flow
              </div>
            </div>

            {/* Receiver Node */}
            <div style={{
              background: 'rgba(5, 8, 18, 0.9)',
              border: '1px solid var(--border-violet)',
              borderRadius: 8,
              padding: '12px 16px',
              textAlign: 'center',
              boxShadow: 'var(--violet-glow)',
              width: 170
            }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase' }}>DESTINATION NODE</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                {steps[currentStep].to}
              </div>
            </div>
          </div>

          {/* Keyframe styles for beam */}
          <style>{`
            @keyframes replay-flow-beam {
              0% { left: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { left: 100%; opacity: 0; }
            }
          `}</style>
        </div>

        {/* Selected Step Description Card */}
        <div style={{
          background: 'rgba(5, 8, 18, 0.8)',
          border: '1px solid var(--border-1)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 16
        }}>
          <h4 style={{ margin: '0 0 6px', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: 'var(--cyan-400)' }}>
            {steps[currentStep].stage}
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
            {steps[currentStep].desc}
          </p>
        </div>

        {/* Player controls */}
        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost" style={{ padding: '6px 12px' }} onClick={handlePrev} disabled={currentStep === 0}>
              <ChevronLeft size={14} /> Back
            </button>
            <button className="btn-ghost" style={{ padding: '6px 12px' }} onClick={handleReset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* Main Play/Pause */}
          <button
            className="btn-primary"
            style={{ width: 120, justifyContent: 'center' }}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Speed select */}
            <div style={{ display: 'flex', background: 'rgba(5,8,18,0.5)', border: '1px solid var(--border-1)', borderRadius: 6, overflow: 'hidden' }}>
              {[1, 2, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  style={{
                    border: 'none',
                    background: playbackSpeed === s ? 'var(--cyan-dim)' : 'transparent',
                    color: playbackSpeed === s ? 'var(--cyan-500)' : 'var(--text-3)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 10.5,
                    padding: '4px 10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button className="btn-ghost" style={{ padding: '6px 12px' }} onClick={handleNext} disabled={currentStep === steps.length - 1}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
