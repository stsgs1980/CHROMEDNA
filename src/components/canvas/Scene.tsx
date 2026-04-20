'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, AdaptiveDpr, AdaptiveEvents, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { EnergyHelix } from './EnergyHelix';
import { CameraRig } from './CameraRig';
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
        <EnergyHelix />
        <CameraRig />
        <AxisLabels />
        <FloatingParticles />

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
