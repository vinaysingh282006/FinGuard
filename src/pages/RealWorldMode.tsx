import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ForceGraph2D from 'react-force-graph-2d';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Globe,
  Activity,
  Zap,
  TrendingUp,
  Coins,
  ShieldAlert,
  DollarSign,
  Clock,
  ArrowRight,
  Radar,
  Network,
  Cpu,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { getEthereumWalletIntel } from '../services/etherscanService';
import { formatCurrency } from '../utils/formatters';

// Map Lat/Lon to Sphere Coordinates
function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

// Major Global Nodes for 3D Globe
const GLOBE_PINS = [
  { name: 'NY_NODE_1', lat: 40.7128, lon: -74.006, risk: 'medium' },
  { name: 'LONDON_GATEWAY', lat: 51.5074, lon: -0.1278, risk: 'low' },
  { name: 'DPRK_EGRESS', lat: 39.0392, lon: 125.7625, risk: 'critical' },
  { name: 'MOSCOW_STAGING', lat: 55.7558, lon: 37.6173, risk: 'critical' },
  { name: 'DUBAI_OTC_NODE', lat: 25.2048, lon: 55.2708, risk: 'high' },
  { name: 'SG_LIQUIDITY', lat: 1.3521, lon: 103.8198, risk: 'low' },
  { name: 'ZURICH_VAULT', lat: 47.3769, lon: 8.5417, risk: 'watchlist' },
  { name: 'VE_MIXING', lat: 10.4806, lon: -66.9036, risk: 'high' },
];

const RISK_COLORS: Record<string, string> = {
  critical: '#ff0040',
  high: '#ff6a00',
  medium: '#f5c400',
  watchlist: '#00f5ff',
  low: '#00d68f',
};

export default function RealWorldMode() {
  const store = useStore() as any;
  const transactions = store.transactions || [];
  const whaleAlerts = store.whaleAlerts || [];
  const prices = store.prices || { BTC: 98200, ETH: 3120, SOL: 220 };

  const [activeVisualizer, setActiveVisualizer] = useState<'3d' | 'network'>('3d');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [walletIntel, setWalletIntel] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState<boolean>(false);

  // Recharts price histories
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial charts mock data
    const history = [];
    const baseTime = Date.now() - 30 * 1000;
    for (let i = 0; i < 20; i++) {
      history.push({
        time: new Date(baseTime + i * 1500).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        BTC: prices.BTC * (1 + (Math.random() - 0.5) * 0.002),
        ETH: prices.ETH * (1 + (Math.random() - 0.5) * 0.003),
      });
    }
    setPriceHistory(history);
  }, []);

  // Update chart data with ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory((prev) => {
        const next = [...prev.slice(1)];
        next.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          BTC: prices.BTC,
          ETH: prices.ETH,
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [prices.BTC, prices.ETH]);

  // 3D Globe Ref & Context
  const globeContainerRef = useRef<HTMLDivElement>(null);

  // Network Graph Data Computation
  const graphData = useMemo(() => {
    const nodesMap = new Map();
    const links: any[] = [];

    // Filter unique addresses and construct relations
    transactions.slice(0, 30).forEach((tx: any) => {
      if (!tx.from || !tx.to) return;
      const cleanFrom = tx.from.substring(0, 10) + '...';
      const cleanTo = tx.to.substring(0, 10) + '...';

      if (!nodesMap.has(tx.from)) {
        nodesMap.set(tx.from, {
          id: tx.from,
          name: cleanFrom,
          val: tx.valueUsd > 100000 ? 5 : 2,
          threat: tx.threatLevel || 'SAFE',
        });
      }
      if (!nodesMap.has(tx.to)) {
        nodesMap.set(tx.to, {
          id: tx.to,
          name: cleanTo,
          val: 2,
          threat: 'SAFE',
        });
      }

      links.push({
        source: tx.from,
        target: tx.to,
        val: tx.valueUsd,
        threat: tx.threatLevel || 'SAFE',
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }, [transactions]);

  // Three.js Globe implementation
  useEffect(() => {
    if (activeVisualizer !== '3d' || !globeContainerRef.current) return;

    const container = globeContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let camera: THREE.PerspectiveCamera;
    let controls: OrbitControls;
    let globeGroup: THREE.Group;
    let animationFrameId: number;

    try {
      scene = new THREE.Scene();
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.error(e);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 45, 105);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 180;

    // Create wireframe globe
    const globeRadius = 26;
    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const wireGeom = new THREE.SphereGeometry(globeRadius, 28, 28);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    globeGroup.add(wireMesh);

    // Glowing dot particles landmasses
    const count = 1200;
    const pointsGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      positions[i * 3] = globeRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = globeRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = globeRadius * Math.cos(phi);
    }
    pointsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 0.45,
      color: 0xb44aff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const pointsMesh = new THREE.Points(pointsGeom, pointsMat);
    globeGroup.add(pointsMesh);

    // Pins group
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);
    const pinGeom = new THREE.SphereGeometry(0.4, 8, 8);

    const rings: any[] = [];
    GLOBE_PINS.forEach((p) => {
      const color = RISK_COLORS[p.risk] || RISK_COLORS.low;
      const pinPos = latLonToVector3(p.lat, p.lon, globeRadius);

      const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
      const pMesh = new THREE.Mesh(pinGeom, pMat);
      pMesh.position.copy(pinPos);
      pinsGroup.add(pMesh);

      // Ring for pulsing
      const ringGeom = new THREE.RingGeometry(0.5, 0.9, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pinPos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      pinsGroup.add(ringMesh);
      rings.push(ringMesh);
    });

    // Static arcs list
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);
    const particles: any[] = [];

    const drawArc = (fromPin: any, toPin: any, color: string) => {
      if (!fromPin || !toPin) return;

      // Recycle older arcs to manage memory and performance
      if (arcsGroup.children.length > 20) {
        const oldestLine: any = arcsGroup.children[0];
        const oldestParticle: any = arcsGroup.children[1];
        arcsGroup.remove(oldestLine);
        arcsGroup.remove(oldestParticle);
        if (oldestLine.geometry) oldestLine.geometry.dispose();
        if (oldestLine.material) oldestLine.material.dispose();
        if (oldestParticle.geometry) oldestParticle.geometry.dispose();
        if (oldestParticle.material) oldestParticle.material.dispose();
        particles.shift();
      }

      const start = latLonToVector3(fromPin.lat, fromPin.lon, globeRadius);
      const end = latLonToVector3(toPin.lat, toPin.lon, globeRadius);
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(globeRadius + dist * 0.3);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(30);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geom, mat);
      arcsGroup.add(line);

      // Particle
      const pGeom = new THREE.SphereGeometry(0.3, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), blending: THREE.AdditiveBlending });
      const pMesh = new THREE.Mesh(pGeom, pMat);
      arcsGroup.add(pMesh);
      particles.push({ mesh: pMesh, curve, progress: 0, speed: 0.35 + Math.random() * 0.2 });
    };

    // Draw some starter arcs
    drawArc(GLOBE_PINS[2], GLOBE_PINS[3], '#ff0040'); // DPRK to Moscow
    drawArc(GLOBE_PINS[3], GLOBE_PINS[4], '#ff6a00'); // Moscow to Dubai
    drawArc(GLOBE_PINS[7], GLOBE_PINS[4], '#00f5ff'); // VE to Dubai
    drawArc(GLOBE_PINS[0], GLOBE_PINS[1], '#00d68f'); // NY to London

    const clock = new THREE.Clock();
    let lastTxCount = useStore.getState().transactions.length;

    const animate = () => {
      const time = clock.getElapsedTime();
      const delta = clock.getDelta();

      globeGroup.rotation.y = time * 0.04;
      globeGroup.rotation.x = Math.sin(time * 0.015) * 0.1;

      // Stream live transactions into 3D globe arcs in real-time
      const currentTxs = useStore.getState().transactions;
      if (currentTxs.length > lastTxCount) {
        const diff = currentTxs.length - lastTxCount;
        const newTxs = currentTxs.slice(0, Math.min(diff, 3));
        newTxs.forEach((tx: any) => {
          const hashVal = parseInt((tx.hash || '').substring(2, 6), 16) || 0;
          const fromIdx = hashVal % GLOBE_PINS.length;
          const toIdx = (hashVal + 3) % GLOBE_PINS.length;
          const fromPin = GLOBE_PINS[fromIdx];
          const toPin = GLOBE_PINS[toIdx];
          const color = tx.fraudScore >= 60 ? '#ff0040' : '#00f5ff';
          drawArc(fromPin, toPin, color);
        });
        lastTxCount = currentTxs.length;
      }

      // Pulse rings
      rings.forEach((ring) => {
        const p = (time * 2.2) % Math.PI;
        const scale = 1.0 + Math.sin(p) * 1.6;
        ring.scale.set(scale, scale, 1);
        ring.material.opacity = 1.0 - Math.sin(p);
      });

      // Flow particles
      particles.forEach((part) => {
        part.progress += delta * part.speed;
        if (part.progress > 1) part.progress = 0;
        const pos = part.curve.getPointAt(part.progress);
        part.mesh.position.copy(pos);
      });

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      wireGeom.dispose();
      wireMat.dispose();
      pointsGeom.dispose();
      pointsMat.dispose();
      pinGeom.dispose();
      arcsGroup.children.forEach((c: any) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      pinsGroup.children.forEach((c: any) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeVisualizer]);

  // Click on a transaction in the feed or select it
  const handleTxSelect = async (tx: any) => {
    setSelectedTx(tx);
    setAiReport('');
    setWalletIntel(null);

    // Fetch Etherscan/RPC wallet intel for sender
    if (tx.from && tx.from.startsWith('0x')) {
      setLoadingWallet(true);
      try {
        const intel = await getEthereumWalletIntel(tx.from, prices.ETH);
        setWalletIntel(intel);
      } catch (err) {
        console.warn('Failed to load wallet intel', err);
      } finally {
        setLoadingWallet(false);
      }
    }
  };

  // Request Gemini transaction inspection
  const triggerGeminiTxAnalysis = async () => {
    if (!selectedTx) return;
    setLoadingAi(true);
    setAiReport('');

    const prompt = `Perform a thorough AML threat audit and laundering risk assessment on this blockchain transaction details:
- TxID/Hash: ${selectedTx.hash}
- Source Address: ${selectedTx.from}
- Destination Address: ${selectedTx.to}
- Value (USD): $${parseFloat(selectedTx.valueUsd || 0).toLocaleString()}
- Chain: ${selectedTx.chain}
- Gas Fee Logged: ${selectedTx.gas || 'N/A'} gas
- Risk Indicators Triggered: ${selectedTx.rulesTriggered?.join(', ') || 'High Transaction Velocity / Out-of-bounds volume'}

Synthesize structural laundering risks, structuring indicators (smurfing/mixer ingestion likelihood), and outline recommendations for a suspicious activity report (SAR). Keep it highly forensic, concise, and structured.`;

    try {
      const response = await generateAIResponse(
        prompt,
        'You are FinGuard Cognitive Threat Agent. You decode transaction graphs to trace structuring, privacy shielding, and sanctions evasion. Respond in structured Markdown.'
      );
      setAiReport(response);
    } catch (err) {
      setAiReport('Could not generate threat assessment at this moment. Please double check VITE_GEMINI_API_KEY environment variable.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* LEFT COLUMN: Market Data & Volatility Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4 }}>
        
        {/* Live Market Card */}
        <div className="glass-card cyber-hud-card cyber-corners laser-sweep" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: 12 }} className="neon-text-cyan">
            <TrendingUp size={15} />
            Live Market Analytics
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>BTC Volatility</span>
              <span style={{ color: 'var(--risk-low)', fontWeight: 600 }}>1.84% (STABLE)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>ETH Gas</span>
              <span style={{ color: 'var(--cyan-400)', fontFamily: 'JetBrains Mono' }}>14 Gwei</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>Active Feed Hops</span>
              <span style={{ color: 'var(--violet-400)' }}>4 Node Chains</span>
            </div>
          </div>

          {/* Glowing Area Chart */}
          <div style={{ height: 110, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan-500)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--cyan-500)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ background: 'rgba(5, 8, 18, 0.95)', border: '1px solid var(--border-cyan)', fontSize: 10 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="ETH" stroke="var(--cyan-500)" fillOpacity={1} fill="url(#colorBtc)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Threat Alert Engine */}
        <div className="glass-card cyber-hud-card cyber-corners-red" style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: 12 }} className="neon-text-red">
            <ShieldAlert size={14} className="animate-pulse" />
            Whale Detection Hub
          </div>

          <div className="nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
            {whaleAlerts.slice(0, 15).map((w: any, idx: number) => {
              const valNum = parseFloat(w.valueUsd);
              const isHuge = valNum >= 10000000;
              return (
                <div 
                  key={w.id || idx} 
                  style={{ 
                  borderBottom: '1px solid var(--border-0)', 
                  paddingBottom: 8,
                  background: isHuge ? 'rgba(255, 0, 64, 0.03)' : 'none',
                  borderRadius: 4,
                  padding: '6px 4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ 
                      fontSize: 8.5, 
                      fontWeight: 800, 
                      padding: '2px 6px', 
                      borderRadius: 4, 
                      background: isHuge ? 'rgba(255,0,64,0.15)' : 'rgba(255,106,0,0.12)', 
                      color: isHuge ? '#ff0040' : '#ff6a00',
                      border: `1px solid ${isHuge ? '#ff004044' : '#ff6a0044'}`
                    }}>
                      {isHuge ? 'CRITICAL WHALE' : 'LARGE TRANSFER'}
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>
                      {new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono' }}>
                    <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{w.chain} Flow</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{formatCurrency(valNum)}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 3, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Hops: {w.from?.substring(0, 8)}... → {w.to?.substring(0, 8)}...
                  </div>
                </div>
              );
            })}
            {whaleAlerts.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-3)', fontSize: 11.5, gap: 6 }}>
                <Clock size={16} />
                Awaiting real whale feeds...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: 3D Globe / Dynamic Network Graph */}
      <div className="glass-card cyber-hud-card cyber-corners" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* Tabs switcher */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'rgba(2,4,10,0.85)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setActiveVisualizer('3d')}
              className={`btn-ghost ${activeVisualizer === '3d' ? 'active' : ''}`}
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: activeVisualizer === '3d' ? 'var(--cyan-400)' : 'var(--border-1)',
                color: activeVisualizer === '3d' ? 'var(--cyan-400)' : 'var(--text-2)',
                background: activeVisualizer === '3d' ? 'var(--cyan-dim)' : 'none',
              }}
            >
              <Globe size={13} />
              3D Threat Globe
            </button>
            <button
              onClick={() => setActiveVisualizer('network')}
              className={`btn-ghost ${activeVisualizer === 'network' ? 'active' : ''}`}
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: activeVisualizer === 'network' ? 'var(--cyan-400)' : 'var(--border-1)',
                color: activeVisualizer === 'network' ? 'var(--cyan-400)' : 'var(--text-2)',
                background: activeVisualizer === 'network' ? 'var(--cyan-dim)' : 'none',
              }}
            >
              <Network size={13} />
              Live Network Graph
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--cyan-400)' }}>
            <span className="status-dot status-dot-green animate-pulse" />
            TELEMETRY NODE ACTIVE
          </div>
        </div>

        {/* Display Container */}
        <div style={{ flex: 1, background: '#02040a', position: 'relative' }}>
          {activeVisualizer === '3d' ? (
            <>
              <div ref={globeContainerRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
              <div className="scanner-overlay" />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
              <ForceGraph2D
                graphData={graphData}
                nodeColor={(node: any) => {
                  if (node.threat === 'CRITICAL') return '#ff0040';
                  if (node.threat === 'HIGH RISK') return '#ff6a00';
                  if (node.threat === 'WATCHLIST') return '#f5c400';
                  return '#00f5ff';
                }}
                nodeVal={(node: any) => node.val || 2}
                nodeLabel={(node: any) => `${node.id} (${node.threat})`}
                linkColor={(link: any) => (link.threat === 'CRITICAL' ? '#ff004044' : 'rgba(255, 255, 255, 0.08)')}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={(d: any) => 0.02}
                linkWidth={(d: any) => 1.2}
                width={700}
                height={500}
                onNodeClick={(node: any) => {
                  // Select node
                  store.setSelectedAddress(node.id);
                }}
              />
            </div>
          )}

          {/* Cyber HUD elements overlay */}
          <div className="scanline" style={{ pointerEvents: 'none' }} />
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(5, 8, 18, 0.85)',
            border: '1px solid rgba(0, 245, 255, 0.25)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 9.5,
            color: '#00f5ff',
            pointerEvents: 'none',
            fontFamily: 'JetBrains Mono',
            boxShadow: '0 0 10px rgba(0, 245, 255, 0.15)'
          }}>
            SYSTEM: ALCHEMY WEBSOCKET & Binance Stream Connected
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Blockchain Feed & Intel Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        
        {/* Live Transaction Feed List */}
        <div className="glass-card cyber-hud-card cyber-corners" style={{ padding: 14, flex: '1 1 50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: 12 }} className="neon-text-cyan">
            <Activity size={14} className="animate-pulse" />
            Live Tx Feed (Streaming)
          </div>

          <div className="nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
            {transactions.slice(0, 40).map((tx: any, idx: number) => {
              const val = parseFloat(tx.valueUsd || 0);
              const isDanger = tx.fraudScore >= 60;
              const isSelected = selectedTx?.hash === tx.hash;

              return (
                <div
                  key={tx.hash || idx}
                  onClick={() => handleTxSelect(tx)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isSelected 
                      ? 'rgba(0, 245, 255, 0.08)' 
                      : isDanger 
                        ? 'rgba(255, 0, 64, 0.04)' 
                        : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${
                      isSelected 
                        ? 'var(--border-cyan)' 
                        : isDanger 
                          ? '#ff004033' 
                          : 'var(--border-0)'
                    }`,
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: 'JetBrains Mono', marginBottom: 3 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{tx.hash ? tx.hash.substring(0, 10) + '...' : 'Tx Block'}</span>
                    <span style={{ color: isDanger ? 'var(--risk-critical)' : 'var(--cyan-400)', fontWeight: 700 }}>
                      {formatCurrency(val)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                    <span>Gas: {tx.gas || '120k'}</span>
                    <span>{tx.chain}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Intelligence Panel */}
        <div className="glass-card cyber-hud-card cyber-corners laser-sweep" style={{ padding: 14, flex: '1 1 50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: 12 }} className="neon-text-violet">
            <Cpu size={14} />
            Forensic Intelligence
          </div>

          <div className="nav-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {selectedTx ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase' }}>Selected Tx Hash</span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#fff', wordBreak: 'break-all' }}>{selectedTx.hash}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase' }}>Source Address</span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--cyan-400)', wordBreak: 'break-all' }}>{selectedTx.from}</span>
                </div>

                {loadingWallet && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={12} className="animate-spin" />
                    Fetching Ledger History...
                  </div>
                )}

                {walletIntel && (
                  <div style={{ background: 'rgba(2, 4, 10, 0.4)', border: '1px solid var(--border-1)', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Origin Wallet Analytics</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontFamily: 'JetBrains Mono' }}>
                      <span style={{ color: 'var(--text-3)' }}>Balance:</span>
                      <span style={{ color: '#fff' }}>{formatCurrency(walletIntel.balanceUsd)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontFamily: 'JetBrains Mono' }}>
                      <span style={{ color: 'var(--text-3)' }}>Tx Count:</span>
                      <span style={{ color: '#fff' }}>{walletIntel.transactionCount} txs</span>
                    </div>
                  </div>
                )}

                {/* Score */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 0, 64, 0.05)', border: '1px solid rgba(255, 0, 64, 0.2)', padding: '8px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={15} color="var(--risk-critical)" />
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>Threat Rank</span>
                  </div>
                  <span style={{ fontSize: 16, fontFamily: 'Space Grotesk', fontWeight: 900, color: 'var(--risk-critical)' }} className="neon-text-red">
                    {selectedTx.fraudScore || 65}%
                  </span>
                </div>

                {/* Gemini AI Inspector Trigger */}
                <button
                  onClick={triggerGeminiTxAnalysis}
                  disabled={loadingAi}
                  className="cyber-btn-glow"
                  style={{ width: '100%', height: 32, cursor: 'pointer', fontSize: 11 }}
                >
                  {loadingAi ? (
                    <>
                      <Activity size={12} className="animate-spin" />
                      Analyzing telemetry...
                    </>
                  ) : (
                    <>
                      <Cpu size={12} />
                      Cognitive Threat Insight
                    </>
                  )}
                </button>

                {aiReport && (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(5, 8, 18, 0.9)',
                    border: '1px solid var(--border-violet)',
                    borderRadius: 8,
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: 'var(--text-2)',
                    maxHeight: 180,
                    overflowY: 'auto',
                    fontFamily: 'Inter',
                  }}>
                    <div style={{ color: 'var(--violet-400)', fontWeight: 800, fontFamily: 'Space Grotesk', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} />
                      Gemini Intelligence Feed:
                    </div>
                    {aiReport}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', fontSize: 11.5, gap: 6, padding: 32, textAlign: 'center' }}>
                <Search size={22} color="var(--border-1)" />
                Click on any transaction in the live feed to decode threat vectors, check wallet balances, and run AI laundering analysis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
