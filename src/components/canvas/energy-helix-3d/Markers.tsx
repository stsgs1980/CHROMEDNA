/**
 * EnergyHelix 3D - Markers Components
 * EIA day markers and weather particles
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { HelixCandle } from './types';
import { HELIX_CONSTANTS } from './lib/helixMath';

const { HEIGHT_PER_CANDLE, TURNS_PER_CANDLE, HELIX_RADIUS } = HELIX_CONSTANTS;

export interface EIADayMarkersProps {
  candles: HelixCandle[];
  showEIALayer: boolean;
}

export function EIADayMarkers({ candles, showEIALayer }: EIADayMarkersProps) {
  const eiaCandles = useMemo(() => {
    if (!showEIALayer || candles.length === 0) return [];
    const prices = candles.map((c) => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const targetZRange = 3;

    return candles
      .map((candle, i) => {
        const date = new Date(candle.time * 1000);
        const isWednesday = date.getDay() === 3;
        if (!isWednesday) return null;
        const y = i * HEIGHT_PER_CANDLE;
        const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { y, z, dateStr, index: i };
      })
      .filter(Boolean) as { y: number; z: number; dateStr: string; index: number }[];
  }, [candles, showEIALayer]);

  if (!showEIALayer || eiaCandles.length === 0) return null;

  return (
    <group>
      {eiaCandles.map((marker) => (
        <group key={`eia-${marker.index}`}>
          <mesh position={[0, marker.y, marker.z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[HELIX_RADIUS, 0.03, 8, 48]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, marker.y, marker.z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[HELIX_RADIUS, 0.08, 6, 48]} />
            <meshBasicMaterial color="#FFA500" transparent opacity={0.15} />
          </mesh>
          <Html position={[HELIX_RADIUS + 0.8, marker.y, marker.z]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm border border-amber-500/40 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] font-bold text-amber-300 tracking-wider">EIA</span>
              <span className="text-[8px] text-amber-400/60">{marker.dateStr}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

export interface WeatherParticlesProps {
  candles: HelixCandle[];
  showWeatherLayer: boolean;
}

export function WeatherParticles({ candles, showWeatherLayer }: WeatherParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const { particles, count } = useMemo(() => {
    if (!showWeatherLayer || candles.length === 0) return { particles: [] as { x: number; y: number; z: number; impact: number; phase: number; speed: number }[], count: 0 };

    const prices = candles.map((c) => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const targetZRange = 3;

    const temp: { x: number; y: number; z: number; impact: number; phase: number; speed: number }[] = [];

    candles.forEach((candle, i) => {
      const impact = Math.abs(candle.weatherImpact || 0);
      if (impact < 25) return;

      const y = i * HEIGHT_PER_CANDLE;
      const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;
      const angle = i * TURNS_PER_CANDLE * Math.PI * 2;

      const numParticles = Math.min(8, Math.ceil(impact / 20));

      for (let p = 0; p < numParticles; p++) {
        const offsetAngle = angle + (p / numParticles) * Math.PI * 2;
        const r = HELIX_RADIUS + 0.3 + Math.random() * 0.8;
        temp.push({
          x: Math.cos(offsetAngle) * r,
          y: y + (Math.random() - 0.5) * 0.15,
          z: z + (Math.random() - 0.5) * 0.3,
          impact,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.5,
        });
      }
    });

    return { particles: temp, count: temp.length };
  }, [candles, showWeatherLayer]);

  useFrame((state) => {
    if (!meshRef.current || count === 0) return;
    const time = state.clock.elapsedTime;
    const dummy = dummyRef.current;

    particles.forEach((p, i) => {
      const floatY = p.y + Math.sin(time * p.speed + p.phase) * 0.08;
      const floatX = p.x + Math.cos(time * p.speed * 0.7 + p.phase) * 0.04;
      const floatZ = p.z + Math.sin(time * p.speed * 0.5 + p.phase) * 0.04;
      dummy.position.set(floatX, floatY, floatZ);
      const baseScale = 0.02 + (p.impact / 100) * 0.04;
      const pulseScale = baseScale + Math.sin(time * 2 + p.phase) * 0.005;
      dummy.scale.setScalar(pulseScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!showWeatherLayer || count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#FF6B35" emissive="#FF4500" emissiveIntensity={0.6} transparent opacity={0.7} />
    </instancedMesh>
  );
}
