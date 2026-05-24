import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ZoomIn, ZoomOut, RotateCcw, ShieldAlert, GitBranch, Layers } from 'lucide-react';

const RISK_COLORS = {
  SAFE:     '#00d68f',
  LOW:      '#00d68f',
  MEDIUM:   '#f5c400',
  HIGH:     '#ff6a00',
  CRITICAL: '#ff0040',
};

function getRiskColor(threatLevel) {
  const tl = (threatLevel || 'SAFE').toUpperCase();
  if (tl.includes('CRITICAL') || tl.includes('LAUNDERING') || tl.includes('FRAUD')) return RISK_COLORS.CRITICAL;
  if (tl.includes('HIGH')) return RISK_COLORS.HIGH;
  if (tl.includes('MEDIUM') || tl.includes('WATCH')) return RISK_COLORS.MEDIUM;
  return RISK_COLORS.LOW;
}

// Generate initial nodes
function generateNodes(transactions) {
  const nodeMap = new Map();
  
  const addNode = (address, color, isSender) => {
    if (!nodeMap.has(address)) {
      // Uniform distribution in a 3D cube
      const range = 40;
      nodeMap.set(address, {
        id: address,
        x: (Math.random() - 0.5) * range,
        y: (Math.random() - 0.5) * range,
        z: (Math.random() - 0.5) * range,
        vx: 0, vy: 0, vz: 0,
        fx: 0, fy: 0, fz: 0,
        color,
        label: address.substring(0, 8) + '...',
        volume: isSender ? 800000 + Math.random() * 2000000 : 100000 + Math.random() * 400000,
        riskLevel: color === RISK_COLORS.CRITICAL ? 'critical' : color === RISK_COLORS.HIGH ? 'high' : 'low'
      });
    }
  };

  transactions.slice(0, 30).forEach(tx => {
    const color = getRiskColor(tx.threatLevel);
    addNode(tx.from || `0x${Math.random().toString(16).substr(2, 6)}`, color, true);
    addNode(tx.to || `0x${Math.random().toString(16).substr(2, 6)}`, '#00f5ff', false);
  });

  return Array.from(nodeMap.values());
}

function generateEdges(transactions, nodes) {
  const nodeIds = new Set(nodes.map(n => n.id));
  return transactions.slice(0, 30)
    .filter(tx => nodeIds.has(tx.from) && nodeIds.has(tx.to))
    .map((tx, idx) => ({
      id: `edge_${idx}`,
      from: tx.from,
      to: tx.to,
      suspicious: tx.fraudScore > 70,
      value: tx.valueUsd,
    }));
}

export default function NetworkGraph() {
  const store = useStore();
  const containerRef = useRef(null);
  
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState(null);
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [chainFilter, setChainFilter] = useState('ALL');

  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  // Generate nodes & edges
  useEffect(() => {
    // Generate base nodes from transactions or demo seed
    const txNodes = generateNodes(store.transactions);
    
    // Seed demo nodes if transactions are sparse
    const demoNodes = [];
    if (txNodes.length < 15) {
      const riskLevels = ['critical', 'high', 'medium', 'low'];
      const colors = { critical: '#ff0040', high: '#ff6a00', medium: '#f5c400', low: '#00d68f' };
      for (let i = 0; i < 20; i++) {
        demoNodes.push({
          id: `demo_${i}`,
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 50,
          z: (Math.random() - 0.5) * 50,
          vx: 0, vy: 0, vz: 0,
          fx: 0, fy: 0, fz: 0,
          color: colors[riskLevels[Math.floor(Math.random() * riskLevels.length)]],
          riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
          label: `0x${Math.random().toString(16).substr(2, 6)}...`,
          volume: Math.random() * 1500000
        });
      }
    }

    const finalNodes = [...txNodes, ...demoNodes].slice(0, 45);
    const txEdges = generateEdges(store.transactions, finalNodes);

    const demoEdges = [];
    if (demoNodes.length > 0) {
      for (let i = 0; i < demoNodes.length; i++) {
        demoEdges.push({
          id: `dedge_${i}`,
          from: demoNodes[i].id,
          to: demoNodes[(i + 3 + Math.floor(Math.random() * 4)) % demoNodes.length].id,
          suspicious: Math.random() > 0.7,
          value: Math.random() * 600000
        });
      }
    }

    const finalEdges = [...txEdges, ...demoEdges].slice(0, 50);

    nodesRef.current = finalNodes;
    edgesRef.current = finalEdges;
    
    setNodes(finalNodes);
    setEdges(finalEdges);
  }, [store.transactions.length]);

  // Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || nodes.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 0, 95);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 250;
    controls.minDistance = 25;

    // 4. Create Node meshes in group
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    // Geometry templates
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    
    const nodeMeshes = nodesRef.current.map(node => {
      // Calculate radius based on volume
      const radius = Math.sqrt(node.volume / 80000) * 0.5 + 0.6;
      const isCritical = node.riskLevel === 'critical';

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });

      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.scale.set(radius, radius, radius);
      mesh.position.set(node.x, node.y, node.z);
      nodesGroup.add(mesh);

      // Pulse ring for critical nodes
      let pulseRing = null;
      if (isCritical) {
        const ringGeom = new THREE.RingGeometry(radius + 0.3, radius + 0.6, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(node.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending
        });
        pulseRing = new THREE.Mesh(ringGeom, ringMat);
        pulseRing.position.set(node.x, node.y, node.z);
        scene.add(pulseRing);
      }

      return {
        id: node.id,
        mesh,
        pulseRing,
        baseRadius: radius,
        nodeData: node
      };
    });

    // 5. Create Edge lines & Flow particles
    const edgesGroup = new THREE.Group();
    scene.add(edgesGroup);

    const edgeVisuals = edgesRef.current.map(edge => {
      const fromNode = nodesRef.current.find(n => n.id === edge.from);
      const toNode = nodesRef.current.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      // Draw edge line
      const points = [
        new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z),
        new THREE.Vector3(toNode.x, toNode.y, toNode.z)
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const colorHex = edge.suspicious ? '#ff0040' : 'rgba(255,255,255,0.06)';
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: edge.suspicious ? 0.6 : 0.15,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geom, material);
      edgesGroup.add(line);

      // Flow particle
      const pGeom = new THREE.SphereGeometry(0.25, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(edge.suspicious ? '#ff0040' : '#00f5ff'),
        blending: THREE.AdditiveBlending
      });
      const particle = new THREE.Mesh(pGeom, pMat);
      scene.add(particle);

      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        line,
        particle,
        progress: Math.random(),
        speed: 0.5 + Math.random() * 0.5,
        suspicious: edge.suspicious
      };
    }).filter(Boolean);

    // 6. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    // 7. Raycaster for clicking / hovering nodes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodesGroup.children);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const matchingNode = nodeMeshes.find(n => n.mesh === hitMesh);
        if (matchingNode) {
          setHoveredNodeInfo(matchingNode.nodeData);
          matchingNode.mesh.material.opacity = 1.0;
        }
      } else {
        setHoveredNodeInfo(null);
        nodeMeshes.forEach(n => {
          n.mesh.material.opacity = 0.85;
        });
      }
    };
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    const handleNodeClick = (event) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodesGroup.children);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const matchingNode = nodeMeshes.find(n => n.mesh === hitMesh);
        if (matchingNode && matchingNode.nodeData) {
          // If address matches a transaction in our store, inspect it
          const matchedTx = store.transactions.find(
            t => t.from === matchingNode.id || t.to === matchingNode.id
          );
          if (matchedTx) {
            store.setSelectedTransaction(matchedTx);
          } else {
            store.setSelectedAddress(matchingNode.id);
          }
        }
      }
    };
    renderer.domElement.addEventListener('click', handleNodeClick);

    // 8. Dynamic 3D Force-Directed Layout & Animation
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      const delta = clock.getDelta();

      const ns = nodesRef.current;
      const es = edgesRef.current;

      // ── physics simulation calculations ──
      // Reset forces
      ns.forEach(n => {
        n.fx = 0; n.fy = 0; n.fz = 0;
      });

      // 1. Repulsion forces (push nodes apart)
      for (let i = 0; i < ns.length; i++) {
        const n1 = ns[i];
        for (let j = i + 1; j < ns.length; j++) {
          const n2 = ns[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let dz = n2.z - n1.z;
          let dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.1;
          
          const force = 18 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;

          n1.fx -= fx; n1.fy -= fy; n1.fz -= fz;
          n2.fx += fx; n2.fy += fy; n2.fz += fz;
        }
      }

      // 2. Attraction spring forces (pull linked edges)
      es.forEach(e => {
        const n1 = ns.find(n => n.id === e.from);
        const n2 = ns.find(n => n.id === e.to);
        if (!n1 || !n2) return;

        let dx = n2.x - n1.x;
        let dy = n2.y - n1.y;
        let dz = n2.z - n1.z;
        let dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.1;
        
        // Rest length is 18
        const force = 0.05 * (dist - 18);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        n1.fx += fx; n1.fy += fy; n1.fz += fz;
        n2.fx -= fx; n2.fy -= fy; n2.fz -= fz;
      });

      // 3. Gravity center pull & apply
      ns.forEach(n => {
        n.fx -= n.x * 0.012;
        n.fy -= n.y * 0.012;
        n.fz -= n.z * 0.012;

        n.vx = (n.vx + n.fx) * 0.82;
        n.vy = (n.vy + n.fy) * 0.82;
        n.vz = (n.vz + n.fz) * 0.82;

        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;
      });

      // ── update meshes positions ──
      nodeMeshes.forEach(nm => {
        nm.mesh.position.set(nm.nodeData.x, nm.nodeData.y, nm.nodeData.z);
        if (nm.pulseRing) {
          nm.pulseRing.position.copy(nm.mesh.position);
          // Look at camera to face billboard-like
          nm.pulseRing.quaternion.copy(camera.quaternion);
          // Animate pulsing ring scale
          const pulse = (time * 3) % Math.PI;
          const s = nm.baseRadius * (1.0 + Math.sin(pulse) * 0.7);
          nm.pulseRing.scale.set(s, s, 1);
          nm.pulseRing.material.opacity = 0.8 - Math.sin(pulse);
        }
      });

      // ── update line geometries & flow particles ──
      edgeVisuals.forEach(ev => {
        const fromNode = ns.find(n => n.id === ev.from);
        const toNode = ns.find(n => n.id === ev.to);
        if (!fromNode || !toNode) return;

        // Update line vertices
        const posAttr = ev.line.geometry.attributes.position;
        posAttr.setXYZ(0, fromNode.x, fromNode.y, fromNode.z);
        posAttr.setXYZ(1, toNode.x, toNode.y, toNode.z);
        posAttr.needsUpdate = true;

        // Filter out if suspicious filter is active
        if (showSuspiciousOnly && !ev.suspicious) {
          ev.line.visible = false;
          ev.particle.visible = false;
        } else {
          ev.line.visible = true;
          ev.particle.visible = true;
        }

        // Animate flowing particle along edge path
        ev.progress += delta * ev.speed * 0.3;
        if (ev.progress > 1) ev.progress = 0;

        const px = fromNode.x + (toNode.x - fromNode.x) * ev.progress;
        const py = fromNode.y + (toNode.y - fromNode.y) * ev.progress;
        const pz = fromNode.z + (toNode.z - fromNode.z) * ev.progress;
        ev.particle.position.set(px, py, pz);
      });

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleNodeClick);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      sphereGeometry.dispose();
      nodesGroup.children.forEach(c => {
        if (c.material) c.material.dispose();
      });
      edgesGroup.children.forEach(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      nodeMeshes.forEach(nm => {
        if (nm.pulseRing) {
          nm.pulseRing.geometry.dispose();
          nm.pulseRing.material.dispose();
        }
      });
      edgeVisuals.forEach(ev => {
        ev.particle.geometry.dispose();
        ev.particle.material.dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nodes, showSuspiciousOnly]);

  const criticalCount = nodes.filter(n => n.riskLevel === 'critical').length;
  const highCount = nodes.filter(n => n.riskLevel === 'high').length;

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 120px)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-1)' }}>
      {/* 3D WebGL Canvas */}
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '100%', background: '#02040a', display: 'block' }}
      />

      {/* Hover Inspect overlay */}
      {hoveredNodeInfo && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(5, 8, 18, 0.9)',
          border: `1px solid ${hoveredNodeInfo.color}`,
          borderRadius: 8,
          padding: '12px 14px',
          width: 240,
          boxShadow: 'var(--shadow-3), 0 0 15px rgba(0, 245, 255, 0.1)',
          pointerEvents: 'none',
          fontFamily: 'Inter',
          zIndex: 50,
          animation: 'fadeUp 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hoveredNodeInfo.color }} />
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff' }}>Address Inspect</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--cyan-400)', overflowWrap: 'anywhere', marginBottom: 8 }}>
            {hoveredNodeInfo.id}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-2)', marginBottom: 4 }}>
            <span>Threat Score:</span>
            <span style={{ color: hoveredNodeInfo.color, fontWeight: 700 }}>
              {hoveredNodeInfo.riskLevel.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-2)' }}>
            <span>Associated Vol:</span>
            <span style={{ color: '#fff', fontFamily: 'JetBrains Mono' }}>
              ${Math.floor(hoveredNodeInfo.volume).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Control panel */}
      <div style={{ position: 'absolute', top: 16, right: 16, width: 220, zIndex: 30 }}>
        <div className="glass-card" style={{ padding: 14, background: 'rgba(5, 8, 18, 0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--cyan-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Graph Controls</div>
            <button
              onClick={() => store.setCustomAIPrompt("Analyze the 3D network graph. Explain the transaction cluster density, routing paths, and identify high-risk relationships.")}
              className="btn-ghost"
              style={{ padding: '3px 8px', fontSize: 9.5, borderColor: 'var(--border-violet)', color: 'var(--violet-400)', height: 22, display: 'flex', gap: 4, cursor: 'pointer' }}
            >
              <GitBranch size={10} /> AI Trace
            </button>
          </div>

          {/* Chain Filter */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['ALL', 'BTC', 'ETH'].map(c => (
              <button 
                key={c} 
                onClick={() => setChainFilter(c)} 
                style={{ 
                  flex: 1, fontSize: 9.5, padding: '5px 0', borderRadius: 5, 
                  border: `1px solid ${chainFilter === c ? 'var(--border-cyan)' : 'var(--border-1)'}`, 
                  background: chainFilter === c ? 'var(--cyan-dim)' : 'rgba(5, 8, 18, 0.4)', 
                  color: chainFilter === c ? 'var(--cyan-400)' : 'var(--text-3)', 
                  cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showSuspiciousOnly} 
                onChange={e => setShowSuspiciousOnly(e.target.checked)} 
                style={{ accentColor: 'var(--cyan-500)' }} 
              />
              Tactical anomalies only
            </label>
          </div>

          {/* Stats Box */}
          <div style={{ background: 'rgba(2, 4, 10, 0.6)', border: '1px solid var(--border-1)', borderRadius: 8, padding: '8px 10px', fontSize: 10.5, fontFamily: 'JetBrains Mono', color: 'var(--text-3)', lineHeight: 1.8 }}>
            <div style={{ color: 'var(--text-2)' }}>NODE COUNT: <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{nodes.length}</span></div>
            <div style={{ color: 'var(--text-2)' }}>EDGE COUNT: <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{edges.length}</span></div>
            <div style={{ color: 'var(--text-2)' }}>CRITICAL: <span style={{ color: 'var(--risk-critical)', fontWeight: 700 }}>{criticalCount}</span></div>
            <div style={{ color: 'var(--text-2)' }}>HIGH RISK: <span style={{ color: 'var(--risk-high)', fontWeight: 700 }}>{highCount}</span></div>
          </div>
        </div>
      </div>

      {/* Legend Map */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 30 }}>
        <div className="glass-card" style={{ padding: 12, background: 'rgba(5, 8, 18, 0.85)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Space Grotesk', fontWeight: 700 }}>Tactical Legend</div>
          
          {[
            ['Sanctioned / Mixer Hub', '#ff0040'],
            ['High Laundering risk', '#ff6a00'],
            ['Surveillance Watchlist', '#f5c400'],
            ['Normal Transaction node', '#00f5ff'],
            ['Verified Safe Address', '#00d68f']
          ].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 11, fontFamily: 'Inter', color: 'var(--text-2)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border-0)', marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontFamily: 'Inter', color: 'var(--text-2)' }}>
              <span style={{ width: 14, height: 2, background: '#ff0040', display: 'inline-block' }} />
              Active Evasion Flow
            </div>
          </div>
        </div>
      </div>

      {/* Selected Address/Transaction Action Overlay */}
      {(store.selectedAddress || store.selectedTransaction) && (
        <div style={{
          position: 'absolute',
          bottom: 210,
          left: 16,
          background: 'rgba(5, 8, 18, 0.92)',
          border: '1px solid var(--border-cyan)',
          borderRadius: 10,
          padding: '12px 14px',
          width: 252,
          boxShadow: 'var(--shadow-3), var(--cyan-glow-sm)',
          zIndex: 50,
          fontFamily: 'Inter',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--cyan-400)' }}>TARGET NODE DIAGNOSTICS</span>
            <button 
              onClick={() => { store.setSelectedAddress(null); store.setSelectedTransaction(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--risk-critical)', cursor: 'pointer', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700 }}
            >
              DISMISS
            </button>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, color: '#fff', overflowWrap: 'anywhere', marginBottom: 12 }}>
            {store.selectedTransaction 
              ? `TX: ${store.selectedTransaction.hash.substring(0, 16)}...` 
              : `ADDR: ${store.selectedAddress.substring(0, 16)}...`}
          </div>
          <button
            onClick={() => {
              const target = store.selectedTransaction ? `transaction ${store.selectedTransaction.hash}` : `address ${store.selectedAddress}`;
              store.setCustomAIPrompt(`Perform deep forensic audit on target ${target}. Identify high-risk relationships, laundering score, and mixer interactions.`);
            }}
            className="btn-primary"
            style={{ width: '100%', fontSize: 10.5, padding: '6px 10px', justifyContent: 'center', height: 32 }}
          >
            <GitBranch size={11} /> AI FORENSICS
          </button>
        </div>
      )}
      
      {/* HUD Guide Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        background: 'rgba(5, 8, 18, 0.75)',
        border: '1px solid var(--border-1)',
        borderRadius: 8,
        padding: '6px 12px',
        fontFamily: 'Inter',
        fontSize: 10,
        color: 'var(--text-2)',
        pointerEvents: 'none'
      }}>
        🖱️ Click nodes to investigate | Drag to rotate scene | Scroll to zoom
      </div>
    </div>
  );
}
