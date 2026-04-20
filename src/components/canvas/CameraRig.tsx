'use client';

import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';

export function CameraRig() {
  const controlsRef = useRef<any>(null);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const candles = useMarketStore((s) => s.candles);
  
  // Target the center of the vertical helix (Y = time axis)
  const helixHeight = candles.length * 0.22;
  const targetY = helixHeight * 0.5;

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={30}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.85}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      target={[0, targetY, 0]}
    />
  );
}
