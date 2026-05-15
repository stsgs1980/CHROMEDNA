'use client';

import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { generateHelixData, generateSpiralCurve } from '@/lib/helixMath';
import { ENERGY_SYMBOLS } from '@/types/energy';

const HELIX_RADIUS = 2.2;

export function SpiralBackbone() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  const { buyerCurve, sellerCurve } = useMemo(
    () => generateSpiralCurve(candles),
    [candles]
  );

  const buyerTubeCurve = useMemo(() => {
    if (buyerCurve.length < 2) return null;
    return new THREE.CatmullRomCurve3(
      buyerCurve.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
  }, [buyerCurve]);

  const sellerTubeCurve = useMemo(() => {
    if (sellerCurve.length < 2) return null;
    return new THREE.CatmullRomCurve3(
      sellerCurve.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
  }, [sellerCurve]);

  if (!buyerTubeCurve || !sellerTubeCurve) return null;

  const tubularSegments = candles.length * 3;
  const tubeRadius = 0.03;
  const radialSegments = 8;

  return (
    <group>
      <mesh>
        <tubeGeometry args={[buyerTubeCurve, tubularSegments, tubeRadius, radialSegments, false]} />
        <meshStandardMaterial
          color={info.buyerColor}
          metalness={0.9}
          roughness={0.15}
          emissive={info.buyerColor}
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[sellerTubeCurve, tubularSegments, tubeRadius, radialSegments, false]} />
        <meshStandardMaterial
          color={info.sellerColor}
          metalness={0.9}
          roughness={0.15}
          emissive={info.sellerColor}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

export function ConnectionBars() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const connectionData = useMemo(() => {
    const { buyers, sellers, connections } = generateHelixData(candles, symbol);
    if (connections.length === 0) return [];
    const step = Math.max(1, Math.floor(connections.length / 15));
    return connections
      .filter((_, i) => i % step === 0)
      .map(([bi, si], idx) => {
        if (!buyers[bi] || !sellers[si]) return null;
        const start = new THREE.Vector3(...buyers[bi].position);
        const end = new THREE.Vector3(...sellers[si].position);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const direction = end.clone().sub(start);
        const length = direction.length();
        return { position: mid.toArray() as [number, number, number], scale: [0.025, Math.max(0.01, length), 0.025] as [number, number, number], key: idx };
      })
      .filter(Boolean);
  }, [candles, symbol]);

  if (connectionData.length === 0) return null;

  return (
    <Instances limit={25}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.35} emissive="#ffffff" emissiveIntensity={0.1} />
      {connectionData.map((conn) => (
        <Instance key={conn!.key} position={conn!.position} scale={conn!.scale} />
      ))}
    </Instances>
  );
}
