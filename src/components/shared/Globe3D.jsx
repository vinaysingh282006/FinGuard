import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore } from '../../store/useStore';

// Converts Lat/Lon coordinates to 3D Vector coordinates on a sphere of given radius
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  
  return new THREE.Vector3(x, y, z);
}

// Major global threat pins
const HUD_PINS = [
  { name: 'Moscow Evasion Hub', lat: 55.7558, lon: 37.6173, risk: 'critical', size: 1.2 },
  { name: 'Pyongyang (DPRK) Exploits', lat: 39.0392, lon: 125.7625, risk: 'critical', size: 1.4 },
  { name: 'Tehran Shadow Banking', lat: 35.6892, lon: 51.3890, risk: 'critical', size: 1.1 },
  { name: 'New York Wall Street', lat: 40.7128, lon: -74.0060, risk: 'medium', size: 0.8 },
  { name: 'London Banking City', lat: 51.5074, lon: -0.1278, risk: 'low', size: 0.7 },
  { name: 'Dubai OTC Exchange', lat: 25.2048, lon: 55.2708, risk: 'high', size: 1.0 },
  { name: 'Singapore Cyber Gateway', lat: 1.3521, lon: 103.8198, risk: 'low', size: 0.7 },
  { name: 'Zurich Offshore Vaults', lat: 47.3769, lon: 8.5417, risk: 'watchlist', size: 0.7 },
  { name: 'Venezuela Petro Mixer', lat: 10.4806, lon: -66.9036, risk: 'high', size: 0.9 },
  { name: 'Hong Kong Node Cluster', lat: 22.3193, lon: 114.1694, risk: 'medium', size: 0.8 }
];

// Active transaction paths to draw
const TRANSACTION_ARCS = [
  { from: 'Moscow Evasion Hub', to: 'Dubai OTC Exchange', risk: 'critical' },
  { from: 'Pyongyang (DPRK) Exploits', to: 'Moscow Evasion Hub', risk: 'critical' },
  { from: 'Tehran Shadow Banking', to: 'Zurich Offshore Vaults', risk: 'high' },
  { from: 'New York Wall Street', to: 'London Banking City', risk: 'low' },
  { from: 'London Banking City', to: 'Singapore Cyber Gateway', risk: 'low' },
  { from: 'Dubai OTC Exchange', to: 'Singapore Cyber Gateway', risk: 'medium' },
  { from: 'Venezuela Petro Mixer', to: 'Tehran Shadow Banking', risk: 'high' },
  { from: 'Hong Kong Node Cluster', to: 'New York Wall Street', risk: 'medium' },
  { from: 'Pyongyang (DPRK) Exploits', to: 'Tehran Shadow Banking', risk: 'critical' }
];

const RISK_COLORS = {
  critical: '#ff0040',
  high: '#ff6a00',
  medium: '#f5c400',
  watchlist: '#00f5ff',
  low: '#00d68f'
};

export default function Globe3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
    camera.position.set(0, 50, 110);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 60;
    controls.maxDistance = 200;

    // 4. Create Globe Base (Holographic Wireframe Grid)
    const globeRadius = 30;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Grid wireframe mesh
    const wireGeom = new THREE.SphereGeometry(globeRadius, 30, 30);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    });
    const globeWire = new THREE.Mesh(wireGeom, wireMat);
    globeGroup.add(globeWire);

    // Outer atmosphere glow shell
    const glowGeom = new THREE.SphereGeometry(globeRadius + 0.5, 30, 30);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.02,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const globeGlow = new THREE.Mesh(glowGeom, glowMat);
    globeGroup.add(globeGlow);

    // Create dot-grid landmass approximation (holographic look)
    const dotCount = 1800;
    const dotGeom = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      // Uniformly distribute points on sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.sin(phi) * Math.sin(theta);
      const z = globeRadius * Math.cos(phi);

      dotPositions[i * 3] = x;
      dotPositions[i * 3 + 1] = y;
      dotPositions[i * 3 + 2] = z;
    }
    dotGeom.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    
    // Tiny round particle texture
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 8;
    dotCanvas.height = 8;
    const dotCtx = dotCanvas.getContext('2d');
    const grad = dotCtx.createRadialGradient(4, 4, 0, 4, 4, 4);
    grad.addColorStop(0, 'rgba(0,245,255,1)');
    grad.addColorStop(0.5, 'rgba(180,74,255,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    dotCtx.fillStyle = grad;
    dotCtx.fillRect(0,0,8,8);
    const dotTexture = new THREE.CanvasTexture(dotCanvas);

    const dotMat = new THREE.PointsMaterial({
      size: 0.6,
      map: dotTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const globeDots = new THREE.Points(dotGeom, dotMat);
    globeGroup.add(globeDots);

    // 5. Build Threat Hotspot Pins & Labels
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);

    const pinGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const pulseRings = [];

    HUD_PINS.forEach(p => {
      const colorHex = RISK_COLORS[p.risk] || RISK_COLORS.low;
      const pinPos = latLonToVector3(p.lat, p.lon, globeRadius);

      // Sphere marker
      const pinMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        blending: THREE.AdditiveBlending
      });
      const pinMesh = new THREE.Mesh(pinGeometry, pinMat);
      pinMesh.position.copy(pinPos);
      pinsGroup.add(pinMesh);

      // Pulse ring
      const ringGeom = new THREE.RingGeometry(0.8, 1.2, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pinPos);
      // Orient the ring perpendicular to the sphere surface normal
      ringMesh.lookAt(new THREE.Vector3(0,0,0));
      pinsGroup.add(ringMesh);

      pulseRings.push({
        mesh: ringMesh,
        baseScale: p.size,
        colorHex
      });
    });

    // 6. Draw Transaction Bezier Curves and Flowing Particles
    const linesGroup = new THREE.Group();
    globeGroup.add(linesGroup);
    
    const flowingParticles = [];
    const dynamicArcs = [];
    let lastTxCount = useStore.getState().transactions.length;

    const triggerDynamicArc = (tx) => {
      const hashInt = parseInt((tx.hash || '').substring(2, 6), 16) || 0;
      const fromIdx = hashInt % HUD_PINS.length;
      const toIdx = (hashInt + 3) % HUD_PINS.length;

      const pinFrom = HUD_PINS[fromIdx];
      const pinTo = HUD_PINS[toIdx];
      if (!pinFrom || !pinTo) return;

      const startVec = latLonToVector3(pinFrom.lat, pinFrom.lon, globeRadius);
      const endVec = latLonToVector3(pinTo.lat, pinTo.lon, globeRadius);

      const distance = startVec.distanceTo(endVec);
      const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
      midVec.normalize().multiplyScalar(globeRadius + distance * 0.45);

      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const curvePoints = curve.getPoints(30);
      const curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);

      const score = tx.fraudScore || 0;
      const colorHex = score >= 81 ? '#ff0040' : score >= 61 ? '#ff6a00' : '#00f5ff';

      const curveMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(curveGeom, curveMat);
      linesGroup.add(line);

      const pGeom = new THREE.SphereGeometry(0.5, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        blending: THREE.AdditiveBlending
      });
      const particle = new THREE.Mesh(pGeom, pMat);
      linesGroup.add(particle);

      dynamicArcs.push({
        line,
        particle,
        curve,
        progress: 0,
        speed: 0.6 + Math.random() * 0.4,
        maxLife: 2.0,
        age: 0
      });
    };

    TRANSACTION_ARCS.forEach((arcData, index) => {
      const pinFrom = HUD_PINS.find(p => p.name === arcData.from);
      const pinTo = HUD_PINS.find(p => p.name === arcData.to);
      if (!pinFrom || !pinTo) return;

      const startVec = latLonToVector3(pinFrom.lat, pinFrom.lon, globeRadius);
      const endVec = latLonToVector3(pinTo.lat, pinTo.lon, globeRadius);

      // Determine height of curve based on coordinate distance
      const distance = startVec.distanceTo(endVec);
      const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
      // Pull midpoint out from core to create curved height
      midVec.normalize().multiplyScalar(globeRadius + distance * 0.35);

      // Create quadratic Bezier curve
      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const curvePoints = curve.getPoints(40);
      const curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
      
      const isCritical = arcData.risk === 'critical';
      const isHigh = arcData.risk === 'high';
      const colorHex = RISK_COLORS[arcData.risk] || RISK_COLORS.low;

      const curveMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: isCritical ? 0.6 : isHigh ? 0.4 : 0.25,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(curveGeom, curveMat);
      linesGroup.add(line);

      // Flowing particle beam mesh
      const beamGeom = new THREE.SphereGeometry(0.35, 8, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        blending: THREE.AdditiveBlending
      });
      const beamMesh = new THREE.Mesh(beamGeom, beamMat);
      linesGroup.add(beamMesh);

      flowingParticles.push({
        mesh: beamMesh,
        curve: curve,
        speed: 0.18 + Math.random() * 0.1,
        progress: Math.random(), // Randomize starting progress
        colorHex
      });
    });

    // 7. Ambient Lighting (For wireframe glow look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 8. Animation loop
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      const time = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Check for new transactions in store
      const currentTxs = useStore.getState().transactions;
      if (currentTxs.length > lastTxCount) {
        const diff = currentTxs.length - lastTxCount;
        const newTxs = currentTxs.slice(0, Math.min(diff, 5)); // cap at 5 to prevent spike overload
        newTxs.forEach(tx => {
          triggerDynamicArc(tx);
        });
        lastTxCount = currentTxs.length;
      }

      // Slow rotation of globe group when not being dragged
      if (!controls.state === -1) {
        globeGroup.rotation.y = time * 0.05;
      } else {
        globeGroup.rotation.y += 0.001; // subtle override
      }

      // Animate pulsing rings on pins
      pulseRings.forEach(ring => {
        const pulse = (time * 2.5) % Math.PI;
        const scale = ring.baseScale * (1.0 + Math.sin(pulse) * 1.5);
        ring.mesh.scale.set(scale, scale, 1);
        ring.mesh.material.opacity = 1.0 - (Math.sin(pulse));
      });

      // Animate flowing particles along curves
      flowingParticles.forEach(p => {
        p.progress += delta * p.speed;
        if (p.progress > 1) p.progress = 0;
        
        const pos = p.curve.getPointAt(p.progress);
        p.mesh.position.copy(pos);
      });

      // Animate dynamic transaction arcs
      for (let i = dynamicArcs.length - 1; i >= 0; i--) {
        const arc = dynamicArcs[i];
        arc.progress += delta * arc.speed;
        arc.age += delta;

        if (arc.progress > 1 || arc.age > arc.maxLife) {
          linesGroup.remove(arc.line);
          linesGroup.remove(arc.particle);
          arc.line.geometry.dispose();
          arc.line.material.dispose();
          arc.particle.geometry.dispose();
          arc.particle.material.dispose();
          dynamicArcs.splice(i, 1);
        } else {
          const pos = arc.curve.getPointAt(arc.progress);
          arc.particle.position.copy(pos);
          arc.line.material.opacity = 0.8 * (1.0 - arc.progress);
        }
      }

      controls.update();
      renderer.render(scene, camera);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 9. Resize handler
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
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      wireGeom.dispose();
      wireMat.dispose();
      glowGeom.dispose();
      glowMat.dispose();
      dotGeom.dispose();
      dotMat.dispose();
      pinGeometry.dispose();
      linesGroup.children.forEach(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      pinsGroup.children.forEach(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 450 }} />
      {/* HUD Info Panels Overlay */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(5, 8, 18, 0.85)',
        border: '1px solid var(--border-cyan)',
        borderRadius: 8,
        padding: '10px 14px',
        pointerEvents: 'none',
        fontFamily: 'Inter',
        fontSize: 10.5,
        color: 'var(--text-2)',
        maxWidth: 220,
        boxShadow: 'var(--shadow-3), var(--cyan-glow-sm)'
      }}>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--cyan-500)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>3D Node Coordinates</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>NY NODE: <span style={{ fontFamily: 'JetBrains Mono', color: '#fff' }}>40.71° N, 74.00° W</span></div>
          <div>DPRK NODE: <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--risk-critical)' }}>39.03° N, 125.76° E</span></div>
          <div>MOSCOW NODE: <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--risk-critical)' }}>55.75° N, 37.61° E</span></div>
          <div>DUBAI NODE: <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--risk-high)' }}>25.20° N, 55.27° E</span></div>
        </div>
      </div>
    </div>
  );
}
