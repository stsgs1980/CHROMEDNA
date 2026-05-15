'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';

const HEIGHT_PER_CANDLE = 0.22;

export function HelixAxisArrows() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const axisData = useMemo(() => {
    if (candles.length === 0) return null;
    const yTop = candles.length * HEIGHT_PER_CANDLE;
    const prices = candles.map((c) => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const targetZRange = 3;
    const zEnd = targetZRange / 2;

    return { yTop, zEnd };
  }, [candles, symbol]);

  const timeLightRef = useRef<THREE.PointLight>(null);
  const priceLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulseIntensity = 0.8 + Math.sin(time * 2) * 0.3;
    if (timeLightRef.current) timeLightRef.current.intensity = pulseIntensity;
    if (priceLightRef.current) priceLightRef.current.intensity = pulseIntensity * 0.7;
  });

  if (!axisData) return null;

  const { yTop, zEnd } = axisData;

  return (
    <group>
      <mesh position={[0, yTop + 0.3, 0]}>
        <coneGeometry args={[0.12, 0.4, 8]} />
        <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={0.8} metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight ref={timeLightRef} position={[0, yTop + 0.5, 0]} color="#22C55E" intensity={0.8} distance={3} decay={2} />

      <mesh position={[0, yTop / 2, zEnd + 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.4, 8]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight ref={priceLightRef} position={[0, yTop / 2, zEnd + 0.5]} color="#F59E0B" intensity={0.6} distance={3} decay={2} />

      <Html position={[-4, yTop + 0.8, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-green-400/70 whitespace-nowrap select-none tracking-widest">TIME</div>
      </Html>

      <Html position={[0, -2, zEnd + 1]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-amber-400/70 whitespace-nowrap select-none tracking-widest">PRICE</div>
      </Html>
    </group>
  );
}

export function AxisLabels() {
  const candles = useMarketStore((s) => s.candles);
  const yEnd = candles.length > 0 ? candles.length * HEIGHT_PER_CANDLE : 10;

  return (
    <group>
      <Html position={[-4, yEnd + 0.8, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-green-400/70 whitespace-nowrap select-none tracking-widest">TIME</div>
      </Html>
      <Html position={[0, -2, 2]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-amber-400/70 whitespace-nowrap select-none tracking-widest">PRICE</div>
      </Html>
    </group>
  );
}
