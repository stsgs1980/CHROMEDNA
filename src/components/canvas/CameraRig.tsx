'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';

export function CameraRig() {
  const controlsRef = useRef<any>(null);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const candles = useMarketStore((s) => s.candles);
  const { camera } = useThree();

  // Calculate center position based on candle count
  const centerZ = candles.length > 0 ? (candles.length * 0.35) / 2 : 5;

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(
        new THREE.Vector3(0, 0, centerZ),
        0.02
      );
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={0.3}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={25}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
      target={[0, 0, centerZ]}
    />
  );
}
