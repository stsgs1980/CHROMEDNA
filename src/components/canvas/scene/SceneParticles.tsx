'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { ENERGY_SYMBOLS } from '@/types/energy';
import { generateHelixData } from '@/lib/helixMath';

const TRAIL_COUNT = 40;
const PARTICLE_COUNT = 30;
const HEIGHT_PER_CANDLE = 0.22;
const HELIX_RADIUS = 2.2;

export function HelixParticleTrail() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

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
          age: (buyers.length - n) / lastN,
        });
      }
    }

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
      <meshStandardMaterial color={info.buyerColor} emissive={info.buyerColor} emissiveIntensity={0.8} transparent opacity={0.5} />
    </instancedMesh>
  );
}

export function DataStreamEffect() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  const particleData = useMemo(() => {
    const data: { progress: number; speed: number; spiralOffset: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        progress: Math.random(),
        speed: 0.02 + Math.random() * 0.03,
        spiralOffset: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  const helixParams = useMemo(() => {
    if (candles.length === 0) return null;
    const prices = candles.map((c) => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const targetZRange = 3;
    const totalHeight = candles.length * HEIGHT_PER_CANDLE;
    const turnsPerCandle = 0.1;

    return { minPrice, priceRange, targetZRange, totalHeight, radius: HELIX_RADIUS, turnsPerCandle, candleCount: candles.length };
  }, [candles, symbol]);

  useFrame((_, delta) => {
    if (!meshRef.current || !helixParams) return;
    const dummy = dummyRef.current;
    const { minPrice, priceRange, targetZRange, turnsPerCandle, candleCount } = helixParams;

    particleData.forEach((p) => {
      p.progress += p.speed * delta;
      if (p.progress >= 1) p.progress -= 1;

      const candleIndex = p.progress * (candleCount - 1);
      const y = candleIndex * HEIGHT_PER_CANDLE;
      const angle = candleIndex * turnsPerCandle * Math.PI * 2 + p.spiralOffset;
      const approxPrice = minPrice + (0.5 + Math.sin(p.progress * Math.PI * 2) * 0.3) * priceRange;
      const z = ((approxPrice - minPrice) / priceRange) * targetZRange - targetZRange / 2;
      const x = Math.cos(angle) * HELIX_RADIUS;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.025);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(particleData.indexOf(p), dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!helixParams) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color={info.buyerColor} emissive="#FFD700" emissiveIntensity={0.9} transparent opacity={0.7} />
    </instancedMesh>
  );
}
