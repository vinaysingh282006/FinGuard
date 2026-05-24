import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

// Get threat level configuration
function getCoreConfig(threatIndex) {
  if (threatIndex >= 91) {
    return { color: '#b44aff', speed: 4.5, noise: 4.8, pulse: 1.4, label: 'LAUNDERING CASCADE DETECTED' };
  } else if (threatIndex >= 81) {
    return { color: '#ff0040', speed: 3.5, noise: 3.5, pulse: 1.2, label: 'CRITICAL THREAT IN PROGRESS' };
  } else if (threatIndex >= 61) {
    return { color: '#ff6a00', speed: 2.5, noise: 2.2, pulse: 0.9, label: 'HIGH RISK DETECTED' };
  } else if (threatIndex >= 31) {
    return { color: '#00f5ff', speed: 1.5, noise: 1.0, pulse: 0.6, label: 'MONITORING ACTIVE' };
  } else {
    return { color: '#00d68f', speed: 0.8, noise: 0.4, pulse: 0.3, label: 'SECURE' };
  }
}

export default function AICoreOrb({ width = 140, height = 140 }) {
  const containerRef = useRef(null);
  const threatIndex = useStore((state) => state.stats?.threatIndex || 42);
  const demoActive = useStore((state) => state.demoActive);
  
  // We use ref to pass values into the animation loop dynamically without re-creating the WebGL context
  const configRef = useRef(getCoreConfig(threatIndex));

  useEffect(() => {
    configRef.current = getCoreConfig(threatIndex);
  }, [threatIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Renderer & Scene
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    
    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 500);
    camera.position.z = 90;

    // 3. Create Round Particle Texture
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const ctx = particleCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    // 4. Geometry setup (Particle Sphere)
    const particleCount = 750;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(Math.random() * 2 - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 24; // Sphere radius
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 5. Material
    const material = new THREE.PointsMaterial({
      size: 2.2,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // 6. Ring Accents (Orbit ring)
    const ringGeom = new THREE.RingGeometry(29, 30, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(configRef.current.color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const config = configRef.current;
      
      // Interpolate material color towards config color
      const targetColor = new THREE.Color(config.color);
      material.color.lerp(targetColor, 0.05);
      ringMat.color.copy(material.color);

      // Rotate whole system
      const rotSpeed = config.speed * 0.15;
      particleSystem.rotation.y = elapsed * rotSpeed * 0.5;
      particleSystem.rotation.x = elapsed * rotSpeed * 0.2;
      ring.rotation.z = -elapsed * rotSpeed * 0.8;

      // Pulse volume scale
      const pulseAmp = config.pulse * 0.08;
      const pulseSpeed = config.speed * 2.5;
      const baseScale = 1.0 + Math.sin(elapsed * pulseSpeed) * pulseAmp;

      // Noise displacement
      const posAttr = geometry.attributes.position;
      const noise = config.noise * 0.8;

      for (let i = 0; i < particleCount; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        const z = originalPositions[i * 3 + 2];

        // 3D Sine noise wave
        const wave = Math.sin(x * 0.08 + elapsed * config.speed * 4) * 
                     Math.cos(y * 0.08 + elapsed * config.speed * 4) * 
                     Math.sin(z * 0.08 + elapsed * config.speed * 4) * noise;

        // Displace outwards from core center (radius 24)
        posAttr.setX(i, x * baseScale + (x / 24) * wave);
        posAttr.setY(i, y * baseScale + (y / 24) * wave);
        posAttr.setZ(i, z * baseScale + (z / 24) * wave);
      }
      
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  const activeConf = getCoreConfig(threatIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        ref={containerRef} 
        style={{ 
          width, 
          height, 
          position: 'relative',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(0,245,255,0.02) 0%, transparent 70%)',
          boxShadow: `inset 0 0 20px rgba(${threatIndex >= 81 ? '255,0,64' : '0,245,255'}, 0.03)`
        }}
      />
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <div style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 9,
          fontWeight: 700,
          color: activeConf.color,
          letterSpacing: '0.1em',
          textShadow: `0 0 8px ${activeConf.color}66`,
          textTransform: 'uppercase'
        }}>
          FTI CORE: {activeConf.label}
        </div>
        <div style={{
          fontFamily: 'Space Grotesk',
          fontSize: 16,
          fontWeight: 700,
          color: '#e2e8f0',
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <span>INDEX {threatIndex}</span>
          <span className="status-dot" style={{ color: activeConf.color, background: activeConf.color, width: 6, height: 6 }} />
        </div>
      </div>
    </div>
  );
}
