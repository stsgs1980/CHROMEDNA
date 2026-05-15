/**
 * EnergyHelix 3D - Selection Components
 * Selection ring and candle label
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { HelixCandle, HelixSymbol, HELIX_SYMBOLS } from './types';
import { generateHelixData } from './lib/helixMath';

export interface SelectionRingProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex: number | null;
}

export function SelectionRing({ candles, symbol, selectedIndex }: SelectionRingProps) {
  const helixData = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  const buyerRingRef = useRef<THREE.Mesh>(null);
  const sellerRingRef = useRef<THREE.Mesh>(null);
  const buyerGlowRef = useRef<THREE.Mesh>(null);
  const sellerGlowRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulseOpacity = 0.55 + Math.sin(time * 3) * 0.25;
    const ringScale = 1.0 + Math.sin(time * 2) * 0.08;

    [buyerRingRef, sellerRingRef].forEach((ref) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial;
        mat.opacity = pulseOpacity;
        ref.current.scale.setScalar(ringScale);
      }
    });

    [buyerGlowRef, sellerGlowRef].forEach((ref) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = pulseOpacity * 0.3;
        ref.current.scale.setScalar(ringScale);
      }
    });

    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(time * 4) * 0.1;
    }
  });

  if (selectedIndex === null || !candles[selectedIndex]) return null;
  const buyerPoint = helixData.buyers[selectedIndex];
  const sellerPoint = helixData.sellers[selectedIndex];
  if (!buyerPoint || !sellerPoint) return null;

  const beamHeight = buyerPoint.position[1] + 1;

  return (
    <group>
      <mesh ref={buyerRingRef} position={buyerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.025, 8, 48]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.2} metalness={0.9} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh ref={buyerGlowRef} position={buyerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.08, 6, 48]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} />
      </mesh>
      <mesh ref={sellerRingRef} position={sellerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.025, 8, 48]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.2} metalness={0.9} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh ref={sellerGlowRef} position={sellerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.08, 6, 48]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} />
      </mesh>
      <mesh ref={beamRef} position={[buyerPoint.position[0], buyerPoint.position[1] - beamHeight / 2, buyerPoint.position[2]]}>
        <cylinderGeometry args={[0.015, 0.015, beamHeight, 6]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} />
      </mesh>
      <mesh position={[sellerPoint.position[0], sellerPoint.position[1] - beamHeight / 2, sellerPoint.position[2]]}>
        <cylinderGeometry args={[0.015, 0.015, beamHeight, 6]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

export interface SelectedCandleLabelProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex: number | null;
}

export function SelectedCandleLabel({ candles, symbol, selectedIndex }: SelectedCandleLabelProps) {
  const info = HELIX_SYMBOLS[symbol];
  const helixData = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  if (selectedIndex === null || !candles[selectedIndex]) return null;
  const point = helixData.buyers[selectedIndex];
  if (!point) return null;

  const candle = candles[selectedIndex];
  const change = candle.close - candle.open;
  const changePercent = ((change / candle.open) * 100).toFixed(2);
  const isUp = change >= 0;
  const decimals = symbol === 'CL' ? 2 : 4;
  const date = new Date(candle.time * 1000);
  const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Html position={[point.position[0] + 1, point.position[1] + 0.3, point.position[2]]} center distanceFactor={8}>
      <div className="bg-gray-900/95 backdrop-blur-md border border-amber-500/30 rounded-lg px-3 py-2.5 text-white min-w-[180px] shadow-2xl shadow-amber-500/10">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">{info.symbol}</span>
            <span className="text-[10px] text-gray-400">{timeStr}</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isUp ? '+' : ''}{changePercent}%
          </span>
        </div>
        <div className="text-base font-bold tracking-tight">{candle.close.toFixed(decimals)}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-white/5">
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">O</span><span className="text-gray-300">{candle.open.toFixed(decimals)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">H</span><span className="text-green-400">{candle.high.toFixed(decimals)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">L</span><span className="text-red-400">{candle.low.toFixed(decimals)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">C</span><span className="text-gray-300">{candle.close.toFixed(decimals)}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 mt-1 pt-1 border-t border-white/5">
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">Vol</span><span className="text-gray-300">{(candle.volume / 1000).toFixed(0)}K</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">Delta</span><span className={(candle.delta || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>{((candle.delta || 0) / 1000).toFixed(1)}K</span></div>
        </div>
      </div>
    </Html>
  );
}
