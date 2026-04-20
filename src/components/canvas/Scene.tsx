'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, AdaptiveDpr, AdaptiveEvents, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { EnergyHelix } from './EnergyHelix';
import { CameraRig } from './CameraRig';
import { useMarketStore } from '@/stores/marketStore';
import { ENERGY_SYMBOLS } from '@/types/energy';
import { generateHelixData } from '@/lib/helixMath';
import * as THREE from 'three';

function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        intensity={0.8}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0004, 0.0004)}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

function FloatingParticles() {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 25;
      const y = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 15;
      const speed = 0.01 + Math.random() * 0.03;
      temp.push({ x, y, z, speed, phase: Math.random() * Math.PI * 2 });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const dummy = dummyRef.current;
    
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(time * p.speed + p.phase) * 0.5,
        p.y + Math.cos(time * p.speed + p.phase) * 0.3,
        p.z + Math.sin(time * p.speed * 0.7 + p.phase) * 0.4
      );
      dummy.scale.setScalar(0.02 + Math.sin(time + p.phase) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// Holographic animated grid floor at Y = -1
function HolographicGridFloor() {
  const gridHelperRef = useRef<THREE.GridHelper>(null);
  const gridMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Custom shader for the radial glow
  const glowShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#FFD700') },
      uMinOpacity: { value: 0.05 },
      uMaxOpacity: { value: 0.12 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uMinOpacity;
      uniform float uMaxOpacity;
      varying vec2 vUv;
      void main() {
        // Radial fade from center
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float radialFade = 1.0 - smoothstep(0.0, 0.5, dist);
        
        // Pulse animation
        float pulse = mix(uMinOpacity, uMaxOpacity, (sin(uTime * 0.8) * 0.5 + 0.5));
        
        float alpha = radialFade * pulse;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  }), []);

  // Set gridHelper material to transparent on mount
  const gridHelperCallback = useMemo(() => (el: THREE.GridHelper | null) => {
    if (el) {
      (gridHelperRef as React.MutableRefObject<THREE.GridHelper | null>).current = el;
      const mats = Array.isArray(el.material) ? el.material : [el.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.08;
        (mat as THREE.LineBasicMaterial).color.set('#FFD700');
        mat.depthWrite = false;
      });
    }
  }, []);

  useFrame((state) => {
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    // Pulse the grid helper opacity
    if (gridHelperRef.current) {
      const pulse = 0.05 + (Math.sin(state.clock.elapsedTime * 0.8) * 0.5 + 0.5) * 0.07;
      const mats = Array.isArray(gridHelperRef.current.material)
        ? gridHelperRef.current.material
        : [gridHelperRef.current.material];
      mats.forEach((mat) => {
        mat.opacity = pulse;
      });
    }
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Grid lines */}
      <gridHelper ref={gridHelperCallback} args={[30, 60, '#FFD700', '#FFD700']} />
      {/* Radial glow plane with animated shader */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[14, 14]} />
        <shaderMaterial
          ref={gridMaterialRef}
          transparent
          depthWrite={false}
          uniforms={glowShader.uniforms}
          vertexShader={glowShader.vertexShader}
          fragmentShader={glowShader.fragmentShader}
        />
      </mesh>
    </group>
  );
}

// Particle trail effect that follows the last helix nodes
function HelixParticleTrail() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const TRAIL_COUNT = 40; // particles for the trail

  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  // Compute trail positions from last 5 nodes
  const trailData = useMemo(() => {
    const helixData = generateHelixData(candles, symbol);
    const buyers = helixData.buyers;
    if (buyers.length === 0) return [];

    const lastN = 5;
    const startIdx = Math.max(0, buyers.length - lastN);
    const trailPoints: { x: number; y: number; z: number; age: number }[] = [];

    for (let n = startIdx; n < buyers.length; n++) {
      const point = buyers[n];
      const particlesPerNode = Math.floor(TRAIL_COUNT / lastN);
      for (let p = 0; p < particlesPerNode; p++) {
        const spread = 0.15;
        trailPoints.push({
          x: point.position[0] + (Math.random() - 0.5) * spread,
          y: point.position[1] + (Math.random() - 0.5) * spread * 0.5,
          z: point.position[2] + (Math.random() - 0.5) * spread,
          age: (buyers.length - n) / lastN, // 0 = newest, 1 = oldest
        });
      }
    }

    // Pad to TRAIL_COUNT if needed
    while (trailPoints.length < TRAIL_COUNT) {
      const lastPoint = buyers[buyers.length - 1];
      trailPoints.push({
        x: lastPoint.position[0] + (Math.random() - 0.5) * 0.2,
        y: lastPoint.position[1] + (Math.random() - 0.5) * 0.1,
        z: lastPoint.position[2] + (Math.random() - 0.5) * 0.2,
        age: Math.random(),
      });
    }

    return trailPoints.slice(0, TRAIL_COUNT);
  }, [candles, symbol]);

  // Animate: drift upward and outward, fade
  useFrame((state) => {
    if (!meshRef.current || trailData.length === 0) return;
    const time = state.clock.elapsedTime;
    const dummy = dummyRef.current;

    trailData.forEach((p, i) => {
      const drift = Math.sin(time * 0.5 + i * 0.3) * 0.05;
      const driftUp = Math.cos(time * 0.3 + i * 0.2) * 0.03 + 0.02;
      dummy.position.set(
        p.x + drift * (1 + p.age),
        p.y + driftUp * (time % 3) * 0.1,
        p.z + drift * 0.7 * (1 + p.age)
      );
      // Scale decreases with age, pulsing
      const baseScale = 0.03 * (1 - p.age * 0.6);
      const pulse = Math.sin(time * 2 + i * 0.5) * 0.005;
      dummy.scale.setScalar(Math.max(0.005, baseScale + pulse));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (trailData.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TRAIL_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={info.buyerColor}
        emissive={info.buyerColor}
        emissiveIntensity={0.8}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

// Data Stream Effect - 30 particles traveling along the helix path from bottom to top
function DataStreamEffect() {
  const PARTICLE_COUNT = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  // Each particle has a progress (0..1) along the helix, speed, and spiral offset
  const particleData = useMemo(() => {
    const data: { progress: number; speed: number; spiralOffset: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        progress: Math.random(), // start at random position along helix
        speed: 0.02 + Math.random() * 0.03, // speed along helix
        spiralOffset: Math.random() * Math.PI * 2, // random phase offset on spiral
      });
    }
    return data;
  }, []);

  // Compute helix parameters from candles for position calculation
  const helixParams = useMemo(() => {
    if (candles.length === 0) return null;
    const prices = candles.map((c) => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const targetZRange = 3;
    const totalHeight = candles.length * 0.22; // HEIGHT_PER_CANDLE
    const radius = 2.2; // HELIX_RADIUS
    const turnsPerCandle = 0.1;

    return { minPrice, priceRange, targetZRange, totalHeight, radius, turnsPerCandle, candleCount: candles.length };
  }, [candles, symbol]);

  useFrame((_, delta) => {
    if (!meshRef.current || !helixParams) return;
    const dummy = dummyRef.current;
    const { minPrice, priceRange, targetZRange, totalHeight, radius, turnsPerCandle, candleCount } = helixParams;

    particleData.forEach((p, i) => {
      // Advance progress
      p.progress += p.speed * delta;
      if (p.progress >= 1) {
        p.progress -= 1; // reset to bottom
      }

      // Map progress to helix position
      const candleIndex = p.progress * (candleCount - 1);
      const y = candleIndex * 0.22;
      const angle = candleIndex * turnsPerCandle * Math.PI * 2 + p.spiralOffset;

      // Get approximate Z from price (use a sin-based approximation since we don't have exact candle)
      const approxPrice = minPrice + (0.5 + Math.sin(p.progress * Math.PI * 2) * 0.3) * priceRange;
      const z = ((approxPrice - minPrice) / priceRange) * targetZRange - targetZRange / 2;

      const x = Math.cos(angle) * radius;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.025);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!helixParams) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={info.buyerColor}
        emissive="#FFD700"
        emissiveIntensity={0.9}
        transparent
        opacity={0.7}
      />
    </instancedMesh>
  );
}

function AxisLabels() {
  return (
    <group>
      {/* Y-axis label (Time) */}
      <Html
        position={[-4, 10, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-[10px] font-mono text-gray-500 whitespace-nowrap select-none tracking-widest rotate-90 origin-center">
          TIME ↑
        </div>
      </Html>
      
      {/* Z-axis label (Price) */}
      <Html
        position={[0, -2, 2]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-[10px] font-mono text-gray-500 whitespace-nowrap select-none tracking-widest">
          PRICE →
        </div>
      </Html>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight
        position={[10, 20, 5]}
        angle={0.4}
        penumbra={1}
        intensity={2}
        castShadow
        color="#ffffff"
      />
      <spotLight
        position={[-10, 15, 5]}
        angle={0.4}
        penumbra={1}
        intensity={1}
        color="#FFD700"
      />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#00CED1" />
      <pointLight position={[5, 10, -3]} intensity={0.4} color="#FF6347" />
      <pointLight position={[-5, 15, 3]} intensity={0.3} color="#9370DB" />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#030308']} />
      <fog attach="fog" args={['#030308', 30, 70]} />

      <Suspense fallback={<LoadingFallback />}>
        <SceneLights />
        <HolographicGridFloor />
        <EnergyHelix />
        <CameraRig />
        <AxisLabels />
        <FloatingParticles />
        <HelixParticleTrail />
        <DataStreamEffect />

        <Environment preset="night" />
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.15}
          scale={30}
          blur={2}
          far={10}
        />
        
        {/* Starfield */}
        <Stars radius={60} depth={80} count={1200} factor={3} saturation={0} fade speed={1} />
      </Suspense>

      <PostProcessing />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  );
}
