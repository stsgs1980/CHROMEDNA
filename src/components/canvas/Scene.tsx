'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, AdaptiveDpr, AdaptiveEvents, Stars } from '@react-three/drei';
import { EnergyHelix } from './EnergyHelix';
import { CameraRig } from './CameraRig';
import { PostProcessing, FloatingParticles, SceneLights } from './scene/SceneEffects';
import { HolographicGridFloor } from './scene/SceneFloor';
import { HelixParticleTrail, DataStreamEffect } from './scene/SceneParticles';
import { HelixAxisArrows, AxisLabels } from './scene/SceneIndicators';

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
        <HelixAxisArrows />
        <AxisLabels />
        <FloatingParticles />
        <HelixParticleTrail />
        <DataStreamEffect />

        <Environment preset="night" />
        <ContactShadows position={[0, -1, 0]} opacity={0.15} scale={30} blur={2} far={10} />

        <Stars radius={60} depth={80} count={1200} factor={3} saturation={0} fade speed={1} />
      </Suspense>

      <PostProcessing />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  );
}
