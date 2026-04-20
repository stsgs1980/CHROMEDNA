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
        luminanceThreshold={0.5}
        luminanceSmoothing={0.8}
        intensity={0.6}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0003, 0.0003)}
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

function FloatingParticles() {
  const count = 150;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 30;
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
      dummy.scale.setScalar(0.015 + Math.sin(time + p.phase) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={0.35} />
    </instancedMesh>
  );
}

function AxisLabels() {
  return (
    <group>
      {/* Y-axis label */}
      <Html
        position={[-3.8, 3, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-[10px] font-mono text-gray-600 whitespace-nowrap select-none tracking-widest">
          PRICE →
        </div>
      </Html>
      
      {/* Z-axis label */}
      <Html
        position={[0, -4.8, 12]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-[10px] font-mono text-gray-600 whitespace-nowrap select-none tracking-widest">
          TIME →
        </div>
      </Html>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <spotLight
        position={[10, 15, 10]}
        angle={0.3}
        penumbra={1}
        intensity={1.5}
        castShadow
        color="#ffffff"
      />
      <spotLight
        position={[-10, 10, 5]}
        angle={0.4}
        penumbra={1}
        intensity={0.8}
        color="#FFD700"
      />
      <pointLight position={[0, -3, 20]} intensity={0.6} color="#00CED1" />
      <pointLight position={[5, 5, 0]} intensity={0.3} color="#FF6347" />
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
      camera={{ position: [8, 3, 5], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#030308']} />
      <fog attach="fog" args={['#030308', 25, 50]} />

      <Suspense fallback={<LoadingFallback />}>
        <SceneLights />
        <EnergyHelix />
        <CameraRig />
        <AxisLabels />
        <FloatingParticles />

        <Environment preset="night" />
        <ContactShadows
          position={[0, -5, 10]}
          opacity={0.25}
          scale={20}
          blur={2}
          far={10}
        />
        
        {/* Starfield */}
        <Stars radius={40} depth={50} count={800} factor={3} saturation={0} fade speed={1} />
      </Suspense>

      <PostProcessing />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  );
}
