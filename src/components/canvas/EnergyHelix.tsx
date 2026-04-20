'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { generateHelixData } from '@/lib/helixMath';
import { ENERGY_SYMBOLS } from '@/types/energy';

// Buyer nodes on the upper spiral
function BuyerNodes() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const selectCandle = useMarketStore((s) => s.selectCandle);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const info = ENERGY_SYMBOLS[symbol];

  const { buyers } = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  if (buyers.length === 0) return null;

  return (
    <Instances limit={500}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={info.buyerColor}
        metalness={0.9}
        roughness={0.1}
        emissive={info.buyerColor}
        emissiveIntensity={0.15}
      />
      {buyers.map((point, i) => {
        const isSelected = selectedIndex === i;
        const isHovered = hoveredIndex === i;
        const scaleMultiplier = isSelected ? 1.5 : isHovered ? 1.3 : 1.0;

        return (
          <Instance
            key={`b-${i}`}
            position={point.position}
            scale={point.scale * scaleMultiplier}
            color={isHovered || isSelected ? '#FFFFFF' : undefined}
            onClick={(e) => { e.stopPropagation(); selectCandle(selectedIndex === i ? null : i); }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredIndex(i); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHoveredIndex(null); document.body.style.cursor = 'auto'; }}
          />
        );
      })}
    </Instances>
  );
}

// Seller nodes on the lower spiral
function SellerNodes() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const selectCandle = useMarketStore((s) => s.selectCandle);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const info = ENERGY_SYMBOLS[symbol];

  const { sellers } = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  if (sellers.length === 0) return null;

  return (
    <Instances limit={500}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={info.sellerColor}
        metalness={0.85}
        roughness={0.15}
        emissive={info.sellerColor}
        emissiveIntensity={0.1}
      />
      {sellers.map((point, i) => {
        const isSelected = selectedIndex === i;
        const isHovered = hoveredIndex === i;
        const scaleMultiplier = isSelected ? 1.5 : isHovered ? 1.3 : 1.0;

        return (
          <Instance
            key={`s-${i}`}
            position={point.position}
            scale={point.scale * scaleMultiplier}
            color={isHovered || isSelected ? '#FFFFFF' : undefined}
            onClick={(e) => { e.stopPropagation(); selectCandle(selectedIndex === i ? null : i); }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredIndex(i); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHoveredIndex(null); document.body.style.cursor = 'auto'; }}
          />
        );
      })}
    </Instances>
  );
}

// Spiral curves rendered as small spheres along the path
function SpiralPathNodes() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  const { buyers, sellers } = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  // Create intermediate points between candle nodes for a smoother curve effect
  const curvePoints = useMemo(() => {
    if (buyers.length === 0 || sellers.length === 0) return [];
    
    const points: { position: [number, number, number]; color: string; scale: number }[] = [];andles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  const { buyers, sellers } = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  if (buyers.length === 0) return null;

  // Create intermediate points between candle nodes for a smoother curve effect
  // We use smaller, dimmer spheres along the path
  const curvePoints = useMemo(() => {
    const points: { position: [number, number, number]; color: string; scale: number }[] = [];
    
    for (let i = 0; i < buyers.length - 1; i++) {
      const b1 = buyers[i].position;
      const b2 = buyers[i + 1].position;
      // Mid-point
      points.push({
        position: [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2, (b1[2] + b2[2]) / 2],
        color: info.buyerColor,
        scale: 0.008,
      });
    }
    
    for (let i = 0; i < sellers.length - 1; i++) {
      const s1 = sellers[i].position;
      const s2 = sellers[i + 1].position;
      points.push({
        position: [(s1[0] + s2[0]) / 2, (s1[1] + s2[1]) / 2, (s1[2] + s2[2]) / 2],
        color: info.sellerColor,
        scale: 0.008,
      });
    }
    
    return points;
  }, [buyers, sellers, info]);

  return (
    <Instances limit={1000}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.4} />
      {curvePoints.map((point, i) => (
        <Instance key={`cp-${i}`} position={point.position} scale={point.scale} color={point.color} />
      ))}
    </Instances>
  );
}

// Connection bars between buyer and seller spirals
function ConnectionBars() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const connectionData = useMemo(() => {
    const { buyers, sellers, connections } = generateHelixData(candles, symbol);
    if (connections.length === 0) return [];
    const step = Math.max(1, Math.floor(connections.length / 40));
    return connections
      .filter((_, i) => i % step === 0)
      .map(([bi, si], idx) => {
        if (!buyers[bi] || !sellers[si]) return null;
        const start = new THREE.Vector3(...buyers[bi].position);
        const end = new THREE.Vector3(...sellers[si].position);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const direction = end.clone().sub(start);
        const length = direction.length();
        return { position: mid.toArray() as [number, number, number], scale: [0.004, Math.max(0.01, length), 0.004] as [number, number, number], key: idx };
      })
      .filter(Boolean);
  }, [candles, symbol]);

  if (connectionData.length === 0) return null;

  return (
    <Instances limit={60}>
      <cylinderGeometry args={[1, 1, 1, 4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      {connectionData.map((conn) => (
        <Instance key={conn!.key} position={conn!.position} scale={conn!.scale} />
      ))}
    </Instances>
  );
}

// Price level indicators
function PriceLevelIndicators() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const levels = useMemo(() => {
    if (candles.length === 0) return [];
    const closes = candles.map((c) => c.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;
    const targetYRange = candles.length * 0.35 * 0.6;
    const numLevels = 5;
    const result: { y: number; label: string }[] = [];
    const decimals = symbol === 'CL' ? 2 : 4;
    for (let i = 0; i <= numLevels; i++) {
      const frac = i / numLevels;
      result.push({
        y: frac * targetYRange - targetYRange / 2,
        label: (minPrice + frac * priceRange).toFixed(decimals),
      });
    }
    return result;
  }, [candles, symbol]);

  if (levels.length === 0) return null;
  const zEnd = candles.length * 0.35;

  return (
    <group>
      {levels.map((level, i) => (
        <group key={`pl-${i}`}>
          <mesh position={[-3, level.y, zEnd / 2]}>
            <boxGeometry args={[0.02, 0.005, zEnd]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.04} />
          </mesh>
          <Html position={[-3.5, level.y, zEnd / 2]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="text-[9px] font-mono text-gray-600 whitespace-nowrap select-none">{level.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// Fibonacci levels
function FibonacciLevels() {
  const showFibonacci = useUIStore((s) => s.showFibonacci);
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const fibLevels = useMemo(() => {
    if (!showFibonacci || candles.length < 10) return [];
    const recent = candles.slice(-50);
    const high = Math.max(...recent.map(c => c.high));
    const low = Math.min(...recent.map(c => c.low));
    const range = high - low;
    const closes = candles.map(c => c.close);
    const allMin = Math.min(...closes);
    const allRange = Math.max(...closes) - allMin || 1;
    const targetYRange = candles.length * 0.35 * 0.6;
    const yForPrice = (price: number) => ((price - allMin) / allRange) * targetYRange - targetYRange / 2;
    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
    return ratios.map((ratio, i) => ({
      y: yForPrice(low + range * ratio),
      label: labels[i],
      color: ratio === 0.618 || ratio === 0.382 ? '#9370DB' : '#6B21A8',
      opacity: ratio === 0.618 || ratio === 0.382 ? 0.25 : 0.1,
    }));
  }, [candles, symbol, showFibonacci]);

  if (fibLevels.length === 0) return null;
  const zEnd = candles.length * 0.35;

  return (
    <group>
      {fibLevels.map((level, i) => (
        <group key={`fib-${i}`}>
          <mesh position={[-2.5, level.y, zEnd / 2]}>
            <boxGeometry args={[0.01, 0.003, zEnd]} />
            <meshBasicMaterial color={level.color} transparent opacity={level.opacity} />
          </mesh>
          <Html position={[-2.8, level.y, zEnd / 2]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="text-[8px] font-mono text-purple-400/50 whitespace-nowrap select-none">{level.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// Selected candle tooltip
function SelectedCandleLabel() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const info = ENERGY_SYMBOLS[symbol];
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
    <Html position={[point.position[0] + 0.5, point.position[1] + 0.3, point.position[2]]} center distanceFactor={8}>
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2.5 text-white min-w-[180px] shadow-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">{info.symbol}</span>
            <span className="text-[10px] text-gray-400">{timeStr}</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{changePercent}%
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

// Main helix component
export function EnergyHelix() {
  const groupRef = useRef<THREE.Group>(null);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const showBuyers = useUIStore((s) => s.showBuyers);
  const showSellers = useUIStore((s) => s.showSellers);
  const showConnections = useUIStore((s) => s.showConnections);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {showBuyers && <BuyerNodes />}
      {showSellers && <SellerNodes />}
      <SpiralPathNodes />
      {showConnections && <ConnectionBars />}
      <PriceLevelIndicators />
      <FibonacciLevels />
      <SelectedCandleLabel />
    </group>
  );
}
