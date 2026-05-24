import React, { useEffect, useState, useRef } from 'react';
import { useStore } from './store/useStore';
import { startPricePolling, stopPricePolling } from './services/coingeckoService';
import { startMempoolFeed, stopMempoolFeed, startWhaleMonitoring, stopWhaleMonitoring } from './services/blockchainService';
import { audioEngine } from './services/audioEngine';
import TransactionDetailPanel from './components/transaction/TransactionDetailPanel';
import Dashboard from './pages/Dashboard';
import LiveFeed from './pages/LiveFeed';
import NetworkGraph from './pages/NetworkGraph';
import AIAnalyst from './pages/AIAnalyst';
import GeoIntelligence from './pages/GeoIntelligence';
import ThreatReplay from './pages/ThreatReplay';
import WhaleTracker from './pages/WhaleTracker';
import Alerts from './pages/Alerts';
import AddressLookup from './pages/AddressLookup';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import AICoreOrb from './components/shared/AICoreOrb';
import AIFloatingPanel from './components/layout/AIFloatingPanel';
import RealWorldMode from './pages/RealWorldMode';
import AIMode from './pages/AIMode';

import {
  LayoutDashboard, Activity, Share2, Cpu, Globe,
  Bell, Search, Play, Square, ChevronRight,
  ShieldAlert, Zap, FileText, BarChart2,
  AlertCircle, X, RefreshCw, Volume2, VolumeX,
  Radar, Terminal
} from 'lucide-react';

const PAGES = {
  dashboard:  { label: 'Dashboard',        icon: LayoutDashboard, group: 'Monitoring Hub' },
  livefeed:   { label: 'Live Feed',        icon: Activity,        group: 'Monitoring Hub' },
  network:    { label: 'Network Graph',    icon: Share2,          group: 'Monitoring Hub' },
  geointel:   { label: 'Geo Intelligence', icon: Globe,           group: 'Monitoring Hub' },
  replay:     { label: 'Threat Replay',    icon: RefreshCw,       group: 'Monitoring Hub' },
  whale:      { label: 'Whale Tracker',    icon: Zap,             group: 'Monitoring Hub' },
  alerts:     { label: 'Alerts Console',   icon: ShieldAlert,     group: 'Monitoring Hub' },
  address:    { label: 'Address Intel',    icon: Search,          group: 'Forensics & Reports' },
  aianalyst:  { label: 'AI Analyst',       icon: Cpu,             group: 'Forensics & Reports' },
  upload:     { label: 'Upload & Scan',    icon: FileText,        group: 'Forensics & Reports' },
  analytics:  { label: 'Market Analytics', icon: BarChart2,       group: 'Forensics & Reports' },
  reports:    { label: 'Report Center',    icon: FileText,        group: 'Forensics & Reports' },
  realworld:  { label: 'Real World Mode',  icon: Radar,           group: 'Advanced Ops' },
  aimode:     { label: 'AI Mode',          icon: Terminal,        group: 'Advanced Ops' },
};

function SessionTimer() {
  const [seconds, setSeconds] = useState(7200 + 847);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return <span className="font-mono text-3" style={{ fontSize: 11 }}>{h}:{m}:{s}</span>;
}

function Sidebar({ activeTab, setActiveTab }) {
  const groups = {};
  Object.entries(PAGES).forEach(([key, meta]) => {
    if (!groups[meta.group]) groups[meta.group] = [];
    groups[meta.group].push({ key, ...meta });
  });

  return (
    <aside className="sidebar" style={{ padding: '24px 0 16px' }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #00f5ff, #b44aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(0,245,255,0.4)'
        }}>
          <ShieldAlert size={18} color="#02040a" style={{ strokeWidth: 2.5 }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.2 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: '#f1f5f9', letterSpacing: '0.02em' }}>FINGUARD</span>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, #00f5ff, #b44aff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>X</span>
          </div>
          <div style={{ fontSize: 8.5, color: 'var(--text-3)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 2, fontWeight: 700 }}>AI Threat Intelligence</div>
        </div>
      </div>

      {/* Holographic AI Core Orb Placement */}
      <div style={{ margin: '0 12px 20px', padding: '16px 12px', background: 'rgba(5, 8, 18, 0.4)', border: '1px solid var(--border-1)', borderRadius: 12, display: 'flex', justifyContent: 'center' }}>
        <AICoreOrb width={150} height={150} />
      </div>

      {/* Navigation */}
      <nav className="nav-scroll" style={{ flex: 1, padding: '0 12px' }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="nav-section-label">{group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`nav-item ${activeTab === key ? 'active' : ''}`}
                  onClick={() => {
                    audioEngine.playClick();
                    setActiveTab(key);
                  }}
                  style={{ background: 'none', border: '1px solid transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                  <Icon size={16} className="nav-icon" style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                  {key === 'livefeed' && (
                    <span style={{ marginLeft: 'auto', background: 'var(--risk-critical)', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 9, minWidth: 18, textAlign: 'center', boxShadow: 'var(--risk-critical-glow)' }}>LIVE</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 12px 0', borderTop: '1px solid var(--border-0)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'FEED●ACTIVE', color: 'var(--cyan-500)' },
            { label: 'WS●SECURE', color: 'var(--emerald-500)' },
            { label: 'COGNITIVE●ON', color: 'var(--violet-500)' },
          ].map(({ label, color }) => (
            <span key={label} style={{ fontSize: 8.5, padding: '3px 8px', border: `1px solid ${color}33`, borderRadius: 5, color, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(5, 8, 18, 0.4)' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
              {label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
          <span style={{ fontSize: 9.5, padding: '3px 8px', background: 'rgba(0, 245, 255, 0.05)', border: '1px solid var(--border-cyan)', borderRadius: 5, color: 'var(--cyan-400)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.05em' }}>
            COMMAND CONSOLE
          </span>
          <SessionTimer />
        </div>
      </div>
    </aside>
  );
}

function Header({ activeTab, store }) {
  const prices = store.prices;
  const [demoActive, setDemoActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(audioEngine.getMuteState());
  const pageLabel = PAGES[activeTab]?.label || 'Dashboard';

  const handleMuteToggle = () => {
    const isMute = audioEngine.toggleMute();
    setIsAudioMuted(isMute);
  };

  return (
    <header className="app-header">
      {/* Left: Breadcrumb */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.05em' }}>FINGUARD X</span>
          <ChevronRight size={12} color="var(--text-3)" />
          <span style={{ color: 'var(--cyan-400)', fontWeight: 700, fontFamily: 'Space Grotesk', letterSpacing: '0.05em' }}>{pageLabel.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span className="status-dot status-dot-cyan" style={{ width: 5, height: 5 }} />
          <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono', color: 'var(--text-2)', letterSpacing: '0.02em' }}>
            {(store.stats?.totalMonitored || 1247).toLocaleString()} Transactions Monitored
          </span>
        </div>
      </div>

      {/* Center: Price Chips */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[
          { sym: 'BTC', color: '#F7931A', price: prices?.BTC || 98241, change: 2.4, up: true },
          { sym: 'ETH', color: '#627EEA', price: prices?.ETH || 3124, change: 1.1, up: true },
          { sym: 'SOL', color: '#00FFA3', price: prices?.SOL || 220, change: 0.8, up: false },
        ].map(({ sym, color, price, change, up }) => (
          <div key={sym} className="glass-card" style={{
            padding: '5px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 11.5, cursor: 'default', userSelect: 'none'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--text-1)' }}>{sym}</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-2)' }}>${price.toLocaleString()}</span>
            <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono', color: up ? 'var(--risk-low)' : 'var(--risk-critical)', fontWeight: 700 }}>
              {up ? '▲' : '▼'} {change}%
            </span>
          </div>
        ))}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        
        {/* Audio Mute controller */}
        <button 
          onClick={handleMuteToggle}
          className="btn-ghost"
          style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          title={isAudioMuted ? "Enable Tactical Audio" : "Mute Sound Engine"}
        >
          {isAudioMuted ? (
            <>
              <VolumeX size={15} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 9.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-3)' }}>MUTED</span>
            </>
          ) : (
            <>
              <Volume2 size={15} style={{ color: 'var(--cyan-400)' }} />
              <span style={{ fontSize: 9.5, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--cyan-400)' }}>AUDIO ON</span>
            </>
          )}
        </button>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="glass-input"
            placeholder="Search address..."
            style={{ width: 180, paddingLeft: 32, paddingRight: 12, fontSize: 12 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                audioEngine.playClick();
                store.setSelectedAddress(e.target.value);
              }
            }}
          />
        </div>

        {/* Bell */}
        <button className="btn-ghost" style={{ padding: '7px 8px', position: 'relative' }} onClick={() => audioEngine.playClick()}>
          <Bell size={16} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--risk-critical)', borderRadius: '50%', border: '2px solid var(--bg-base)', boxShadow: 'var(--risk-critical-glow)' }} />
        </button>

        {/* Demo Toggle Button */}
        <button
          className={demoActive ? 'btn-ghost' : 'btn-primary'}
          style={{ fontSize: 11, fontWeight: 700, height: 32, padding: '0 12px' }}
          onClick={() => {
            audioEngine.playClick();
            store.setDemoActive(!demoActive);
          }}
        >
          {demoActive ? <Square size={10} fill="currentColor" style={{ marginRight: 4 }} /> : <Play size={10} fill="currentColor" style={{ marginRight: 4 }} />}
          {demoActive ? 'STOP' : 'DEMO'}
        </button>
      </div>
    </header>
  );
}

function AlertBanner({ visible, onDismiss, store }) {
  const latestAlert = store.alerts[0];
  if (!latestAlert) return null;

  return (
    <div className={`alert-banner ${visible ? 'visible' : ''}`}>
      <AlertCircle size={18} color="#fff" style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#fff', flex: 1, letterSpacing: '0.01em' }}>
        {latestAlert.isSimulated && <span style={{ color: 'var(--cyan-500)', marginRight: 6 }}>[SIMULATED]</span>}
        [{latestAlert.threatLevel}] — {latestAlert.reason || 'Suspicious transfer flow identified'} on {latestAlert.chain} for ${Math.floor(latestAlert.valueUsd).toLocaleString()}
      </span>
      <button 
        onClick={() => {
          audioEngine.playClick();
          store.setSelectedTransaction(latestAlert);
          store.setCustomAIPrompt(`Critical AML Alert! [${latestAlert.threatLevel}] ${latestAlert.reason || 'Suspicious flow'}. Value: $${Math.floor(latestAlert.valueUsd).toLocaleString()} USD. Explain the risk indicators triggered and routing consequences immediately.`);
        }}
        className="btn-ghost" 
        style={{ fontSize: 11, padding: '4px 12px', borderColor: 'rgba(255,255,255,0.5)', color: '#fff', background: 'rgba(180, 74, 255, 0.45)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <Zap size={11} /> AI Explain
      </button>
      <button 
        onClick={() => {
          audioEngine.playClick();
          store.setSelectedTransaction(latestAlert);
        }}
        className="btn-ghost" 
        style={{ fontSize: 11, padding: '4px 12px', borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(0,0,0,0.35)', fontWeight: 700 }}
      >
        Forensics →
      </button>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
        <X size={14} />
      </button>
    </div>
  );
}

function TickerBar() {
  const items = [
    { text: 'BTC-USD: 98,241 (+2.4%)', color: 'var(--cyan-500)' },
    { text: 'ALERT: LAZARUS EXPLOIT DETECTED ON ETH CASCADE', color: 'var(--risk-critical)' },
    { text: 'ETH-GAS: 12 GWEI (Optimal)', color: 'var(--emerald-500)' },
    { text: 'COGNITIVE MODEL RE-TRAINING SUCCESSFUL', color: 'var(--violet-400)' },
    { text: 'SOL-USD: 220.45 (-0.8%)', color: 'var(--text-2)' },
    { text: 'WHALE ALERT: 14,000 ETH MOVED TO COLD WALLET', color: 'var(--risk-high)' },
    { text: 'CYBER SCAN ACTIVE ON ETH MEMPOOL', color: 'var(--cyan-500)' },
    { text: 'SUSPICIOUS STRUCTURING PATTERN FLAG #042', color: 'var(--risk-critical)' },
  ];

  return (
    <footer className="ticker-bar">
      {[0, 1].map(i => (
        <div key={i} className="ticker-content">
          {items.map((item, idx) => (
            <span key={idx} style={{ color: item.color, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
              {item.text}
              <span style={{ color: 'var(--text-3)' }}>&nbsp;·&nbsp;</span>
            </span>
          ))}
        </div>
      ))}
    </footer>
  );
}

export default function App() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertVisible, setAlertVisible] = useState(false);

  // Sync state active tab with Zustand active tab
  useEffect(() => {
    store.setActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    startPricePolling(store);
    startMempoolFeed(store);
    startWhaleMonitoring(store);

    return () => {
      stopPricePolling();
      stopMempoolFeed();
      stopWhaleMonitoring();
      audioEngine.stopAmbientHum();
    };
  }, []);

  // Play audio hum on first user interaction
  useEffect(() => {
    const startAudio = () => {
      audioEngine.startAmbientHum();
      window.removeEventListener('click', startAudio);
    };
    window.addEventListener('click', startAudio);
    return () => window.removeEventListener('click', startAudio);
  }, []);

  // Audio Engine triggers on transaction alerts
  const alerts = store.alerts;
  const prevAlertsLengthRef = useRef(alerts.length);
  useEffect(() => {
    if (alerts.length > prevAlertsLengthRef.current) {
      const latest = alerts[0];
      if (latest) {
        setAlertVisible(true);
        const level = latest.threatLevel || 'HIGH RISK';
        const isCritical = level === 'CRITICAL' || level === 'ACTIVE LAUNDERING' || level === 'FRAUD NETWORK DETECTED';
        
        if (isCritical) {
          audioEngine.playCritical();
          audioEngine.speakAlert(`Warning. Critical AML anomaly detected. ${latest.reason || 'Suspicious transfer flow identified.'}`);
        } else {
          audioEngine.playWarning();
          audioEngine.speakAlert(`Alert. High risk transaction on ${latest.chain}.`);
        }
      }
    }
    prevAlertsLengthRef.current = alerts.length;
  }, [alerts]);

  // Audio Engine triggers for standard transactions
  const transactions = store.transactions;
  const prevTxsLengthRef = useRef(transactions.length);
  useEffect(() => {
    if (transactions.length > prevTxsLengthRef.current) {
      const latest = transactions[0];
      if (latest && latest.fraudScore < 60) {
        audioEngine.playClick();
      }
    }
    prevTxsLengthRef.current = transactions.length;
  }, [transactions]);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard />;
      case 'livefeed':    return <LiveFeed />;
      case 'network':     return <NetworkGraph />;
      case 'geointel':    return <GeoIntelligence />;
      case 'replay':      return <ThreatReplay />;
      case 'whale':       return <WhaleTracker />;
      case 'alerts':      return <Alerts />;
      case 'address':     return <AddressLookup />;
      case 'aianalyst':   return <AIAnalyst />;
      case 'upload':      return <Upload />;
      case 'analytics':   return <Analytics />;
      case 'reports':     return <Reports />;
      case 'realworld':   return <RealWorldMode />;
      case 'aimode':      return <AIMode />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      {/* HUD overlays */}
      <div className="scanline" />
      <div className="cyber-grid" />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Header activeTab={activeTab} store={store} />
      
      <main className="main-content">
        {renderPage()}
      </main>
      
      <TickerBar />
      <AlertBanner visible={alertVisible} onDismiss={() => setAlertVisible(false)} store={store} />
      <TransactionDetailPanel />
      <AIFloatingPanel />

      {/* Cinematic HUD Alert Overlay */}
      {store.systemAlert && (
        <SystemAlertOverlay alert={store.systemAlert} onDismiss={() => store.clearSystemAlert()} />
      )}
    </div>
  );
}

function SystemAlertOverlay({ alert, onDismiss }) {
  useEffect(() => {
    try {
      audioEngine.playCritical();
      audioEngine.speakAlert(`Warning. Connection to blockchain database disrupted.`);
    } catch (e) {}
  }, [alert]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 22, 0.88)',
      backdropFilter: 'blur(12px) saturate(150%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: '#040712',
        border: '2px solid rgba(255, 45, 85, 0.8)',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 0 50px rgba(255, 45, 85, 0.35), inset 0 0 20px rgba(255, 45, 85, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Scanlines overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(rgba(255, 45, 85, 0.03) 50%, rgba(0, 0, 0, 0) 50%)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none'
        }} />

        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(255, 45, 85, 0.1)',
          border: '1px solid #ff2d55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 20px rgba(255, 45, 85, 0.4)'
        }}>
          <ShieldAlert size={26} color="#ff2d55" className="animate-pulse" />
        </div>

        <h3 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 18,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: '0 0 6px'
        }}>
          {alert.title}
        </h3>

        <div style={{
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-3)',
          letterSpacing: '0.05em',
          marginBottom: 16
        }}>
          LOGGED TIME: {alert.timestamp || new Date().toLocaleTimeString()}
        </div>

        <p style={{
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'var(--text-2)',
          margin: '0 0 20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          {alert.message}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: 'rgba(255, 45, 85, 0.04)',
          border: '1px solid rgba(255, 45, 85, 0.15)',
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#ff2d55',
          letterSpacing: '0.02em'
        }}>
          <span className="status-dot status-dot-critical animate-pulse" style={{ width: 6, height: 6 }} />
          AUTOMATIC FAULT RECOVERY INTERFACE ENGAGED
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              audioEngine.playClick();
              onDismiss();
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'none',
              border: '1px solid var(--border-1)',
              borderRadius: 8,
              color: 'var(--text-2)',
              fontSize: 11.5,
              fontWeight: 'bold',
              fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
            }}
          >
            DISMISS HUD
          </button>
          <button
            onClick={() => {
              audioEngine.playClick();
              onDismiss();
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#ff2d55',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 11.5,
              fontWeight: 'bold',
              fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(255, 45, 85, 0.3)',
            }}
          >
            RETRY NOW
          </button>
        </div>
      </div>
    </div>
  );
}
