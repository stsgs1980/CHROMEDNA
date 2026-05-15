'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';

const HEIGHT_PER_CANDLE = 0.22;
const HELIX_RADIUS = 2.2;

export function PriceLevelIndicators() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const levels = useMemo(() => {
    if (candles.length === 0) return [];
    const closes = candles.map((c) => c.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;
    const numLevels = 5;
    const result: { z: number; label: string }[] = [];
    const decimals = symbol === 'CL' ? 2 : 4;
    for (let i = 0; i <= numLevels; i++) {
      const frac = i / numLevels;
      result.push({
        z: frac * 3 - 1.5,
        label: (minPrice + frac * priceRange).toFixed(decimals),
      });
    }
    return result;
  }, [candles, symbol]);

  const keyLevels = useMemo(() => {
    if (candles.length === 0) return [];
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;
    const targetZRange = 3;
    const zForPrice = (price: number) => ((price - minPrice) / priceRange) * targetZRange - targetZRange / 2;

    const currentPrice = closes[closes.length - 1];
    const highPrice = Math.max(...highs);
    const lowPrice = Math.min(...lows);

    return [
      { z: zForPrice(currentPrice), type: 'current' as const, color: '#FFD700', opacity: 0.12, emissiveIntensity: 0.5 },
      { z: zForPrice(highPrice), type: 'high' as const, color: '#32CD32', opacity: 0.06, emissiveIntensity: 0.2 },
      { z: zForPrice(lowPrice), type: 'low' as const, color: '#FF4500', opacity: 0.06, emissiveIntensity: 0.2 },
    ];
  }, [candles, symbol]);

  useFrame((state) => {
    if (materialRef.current) {
      const pulse = 0.08 + Math.sin(state.clock.elapsedTime * 1.5) * 0.06;
      materialRef.current.opacity = pulse;
    }
  });

  if (levels.length === 0) return null;
  const yEnd = candles.length * HEIGHT_PER_CANDLE;
  const planeWidth = HELIX_RADIUS * 2 + 1;

  return (
    <group>
      {levels.map((level, i) => (
        <group key={`pl-${i}`}>
          <mesh position={[-3.5, yEnd / 2, level.z]}>
            <boxGeometry args={[0.02, yEnd, 0.005]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.04} />
          </mesh>
          <Html position={[-4.2, yEnd / 2, level.z]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="text-[9px] font-mono text-gray-500 whitespace-nowrap select-none">{level.label}</div>
          </Html>
        </group>
      ))}
      {keyLevels.map((level, i) => (
        <mesh key={`glow-plane-${i}`} position={[0, yEnd / 2, level.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[planeWidth, yEnd]} />
          {level.type === 'current' ? (
            <meshBasicMaterial ref={materialRef} color={level.color} transparent opacity={level.opacity} side={THREE.DoubleSide} depthWrite={false} />
          ) : (
            <meshStandardMaterial color={level.color} transparent opacity={level.opacity} emissive={level.color} emissiveIntensity={level.emissiveIntensity} side={THREE.DoubleSide} depthWrite={false} />
          )}
        </mesh>
      ))}
    </group>
  );
}

export function FibonacciLevels() {
  const showFibonacci = useUIStore((s) => s.showFibonacci);
  const candles = useMarketStore((s) => s.candles);

  const fibLevels = useMemo(() => {
    if (!showFibonacci || candles.length < 10) return [];
    const recent = candles.slice(-50);
    const high = Math.max(...recent.map(c => c.high));
    const low = Math.min(...recent.map(c => c.low));
    const range = high - low;
    const closes = candles.map(c => c.close);
    const allMin = Math.min(...closes);
    const allRange = Math.max(...closes) - allMin || 1;
    const yForPrice = (price: number) => ((price - allMin) / allRange) * 3 - 1.5;
    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
    return ratios.map((ratio, i) => ({
      z: yForPrice(low + range * ratio),
      label: labels[i],
      color: ratio === 0.618 || ratio === 0.382 ? '#9370DB' : '#6B21A8',
      opacity: ratio === 0.618 || ratio === 0.382 ? 0.25 : 0.1,
    }));
  }, [candles, showFibonacci]);

  if (fibLevels.length === 0) return null;
  const yEnd = candles.length * HEIGHT_PER_CANDLE;

  return (
    <group>
      {fibLevels.map((level, i) => (
        <group key={`fib-${i}`}>
          <mesh position={[-2.8, yEnd / 2, level.z]}>
            <boxGeometry args={[0.01, yEnd, 0.003]} />
            <meshBasicMaterial color={level.color} transparent opacity={level.opacity} />
          </mesh>
          <Html position={[-3.2, yEnd / 2, level.z]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="text-[8px] font-mono text-purple-400/50 whitespace-nowrap select-none">{level.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}
