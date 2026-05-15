/**
 * EnergyHelix 3D - Effects Components
 * Volume heatmap, ambient glow, energy core, connecting arcs
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HelixCandle, HelixSymbol } from './types';
import { generateHelixData, HELIX_CONSTANTS } from './lib/helixMath';

const { HEIGHT_PER_CANDLE, HELIX_RADIUS } = HELIX_CONSTANTS;

export interface VolumeHeatmapProps {
  candles: HelixCandle[];
  showVolumeProfile: boolean;
}

export function VolumeHeatmap({ candles, showVolumeProfile }: VolumeHeatmapProps) {
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const volumeData = useMemo(() => {
    if (!showVolumeProfile || candles.length === 0) return [];

    const maxVolume = Math.max(...candles.map(c => c.volume));
    const step = Math.max(1, Math.floor(candles.length / 60));

    const result: { y: number; normalizedVol: number; index: number }[] = [];
    for (let i = 0; i < candles.length; i += step) {
      const candle = candles[i];
      const y = i * HEIGHT_PER_CANDLE;
      const normalizedVol = candle.volume / maxVolume;
      result.push({ y, normalizedVol, index: i });
    }
    return result;
  }, [candles, showVolumeProfile]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    materialRefs.current.forEach((mat, i) => {
      if (!mat || !volumeData[i]) return;
      const baseOpacity = 0.15 + volumeData[i].normalizedVol * 0.45;
      const pulse = baseOpacity + Math.sin(time * 0.8 + i * 0.3) * (baseOpacity * 0.1);
      mat.opacity = pulse;
    });
  });

  if (!showVolumeProfile || volumeData.length === 0) return null;

  const heatmapRadius = HELIX_RADIUS + 0.3;

  return (
    <group>
      {volumeData.map((d, i) => {
        const volColor = d.normalizedVol > 0.8 ? '#fff7ed' : d.normalizedVol > 0.5 ? '#fbbf24' : '#92400e';
        const emissiveIntensity = 0.2 + d.normalizedVol * 0.8;
        const tubeRadius = 0.015 + d.normalizedVol * 0.04;

        return (
          <mesh key={`vh-${d.index}`} position={[0, d.y, 0]}>
            <torusGeometry args={[heatmapRadius, tubeRadius, 6, 32]} />
            <meshStandardMaterial
              ref={(el) => { materialRefs.current[i] = el; }}
              color={volColor}
              emissive={volColor}
              emissiveIntensity={emissiveIntensity}
              transparent
              opacity={0.15 + d.normalizedVol * 0.45}
              metalness={0.5}
              roughness={0.4}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export interface AmbientGlowRingProps {
  candles: HelixCandle[];
}

export function AmbientGlowRing({ candles }: AmbientGlowRingProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const midHeight = useMemo(() => {
    if (candles.length === 0) return 0;
    return (candles.length * HEIGHT_PER_CANDLE) / 2;
  }, [candles]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.opacity = 0.06 + Math.sin(time * 0.5) * 0.02;
    }
    if (meshRef.current) {
      meshRef.current.rotation.z = time * 0.05;
      meshRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;
    }
  });

  const ringRadius = HELIX_RADIUS + 1.5;

  return (
    <mesh ref={meshRef} position={[0, midHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[ringRadius, 0.15, 8, 64]} />
      <meshBasicMaterial ref={materialRef} color="#FFD700" transparent opacity={0.06} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export interface PulsingEnergyCoreProps {
  candles: HelixCandle[];
}

export function PulsingEnergyCore({ candles }: PulsingEnergyCoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const regimeType = useMemo(() => {
    if (candles.length < 20) return 'QUIET' as const;
    const recent = candles.slice(-20);
    const closes = recent.map(c => c.close);

    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length;
    const volatility = Math.sqrt(variance);

    const priceRange = Math.max(...closes) - Math.min(...closes);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const normalizedRange = priceRange / avgPrice;

    if (volatility > 0.02 && normalizedRange > 0.05) return 'VOLATILE' as const;
    if (normalizedRange < 0.015) return 'QUIET' as const;
    return 'RANGING' as const;
  }, [candles]);

  const midHeight = useMemo(() => {
    if (candles.length === 0) return 0;
    return (candles.length * HEIGHT_PER_CANDLE) / 2;
  }, [candles]);

  const pulseSpeed = regimeType === 'VOLATILE' ? 3.0 : regimeType === 'QUIET' ? 0.8 : 1.5;

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const scalePulse = 1.0 + Math.sin(time * pulseSpeed) * 0.15;

    if (coreRef.current) coreRef.current.scale.setScalar(scalePulse);
    if (innerGlowRef.current) innerGlowRef.current.scale.setScalar(scalePulse * 1.6);
    if (materialRef.current) materialRef.current.emissiveIntensity = 0.6 + Math.sin(time * pulseSpeed) * 0.4;
    if (innerMaterialRef.current) innerMaterialRef.current.opacity = 0.06 + Math.sin(time * pulseSpeed) * 0.03;
  });

  return (
    <group position={[0, midHeight, 0]}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial ref={materialRef} color="#F59E0B" emissive="#FBBF24" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} transparent opacity={0.9} />
      </mesh>
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial ref={innerMaterialRef} color="#FBBF24" transparent opacity={0.06} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#F59E0B" intensity={0.5} distance={4} decay={2} />
    </group>
  );
}

export interface ConnectingEnergyArcsProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
}

export function ConnectingEnergyArcs({ candles, symbol }: ConnectingEnergyArcsProps) {
  const arcData = useMemo(() => {
    if (candles.length === 0) return [];
    const { buyers, sellers } = generateHelixData(candles, symbol);
    if (buyers.length === 0) return [];

    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);

    const currentPrice = closes[closes.length - 1];
    const highPrice = Math.max(...highs);
    const lowPrice = Math.min(...lows);

    const keyLevels = [
      { price: currentPrice, type: 'current' as const },
      { price: highPrice, type: 'high' as const },
      { price: lowPrice, type: 'low' as const },
    ];

    const arcs: { buyerPos: [number, number, number]; sellerPos: [number, number, number]; type: string; phaseOffset: number }[] = [];

    keyLevels.forEach((level) => {
      const distances = candles.map((c, i) => ({ idx: i, dist: Math.abs(c.close - level.price) }));
      distances.sort((a, b) => a.dist - b.dist);
      const closestIndices = distances.slice(0, 3).map((d) => d.idx);

      closestIndices.forEach((idx, j) => {
        if (buyers[idx] && sellers[idx]) {
          arcs.push({
            buyerPos: buyers[idx].position as [number, number, number],
            sellerPos: sellers[idx].position as [number, number, number],
            type: level.type,
            phaseOffset: j * 0.5,
          });
        }
      });
    });

    return arcs;
  }, [candles, symbol]);

  const arcGeometries = useMemo(() => {
    return arcData.map((arc) => {
      const start = new THREE.Vector3(...arc.buyerPos);
      const end = new THREE.Vector3(...arc.sellerPos);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.y += 0.15;

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return { geometry, type: arc.type, phaseOffset: arc.phaseOffset };
    });
  }, [arcData]);

  const materialRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    materialRefs.current.forEach((mat, i) => {
      if (!mat || !arcData[i]) return;
      const baseOpacity = arcData[i].type === 'current' ? 0.35 : 0.2;
      const pulse = Math.sin(time * 1.5 + arcData[i].phaseOffset) * 0.1;
      mat.opacity = baseOpacity + pulse;
    });
  });

  if (arcGeometries.length === 0) return null;

  return (
    <group>
      {arcGeometries.map((arc, i) => {
        const color = arc.type === 'current' ? '#FFD700' : arc.type === 'high' ? '#22C55E' : '#EF4444';
        return (
          <line key={`arc-${i}`} geometry={arc.geometry}>
            <lineBasicMaterial ref={(el) => { materialRefs.current[i] = el; }} color={color} transparent opacity={0.3} depthWrite={false} />
          </line>
        );
      })}
    </group>
  );
}
