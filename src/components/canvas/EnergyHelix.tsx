'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { generateHelixData, generateSpiralCurve } from '@/lib/helixMath';
import { ENERGY_SYMBOLS } from '@/types/energy';

function BuyerNodes() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const selectCandle = useMarketStore((s) => s.selectCandle);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const info = ENERGY_SYMBOLS[symbol];

  const { buyers } = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  return (
    <Instances limit={buyers.length || 1}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={info.buyerColor}
        metalness={0.95}
        roughness={0.05}
        emissive={info.buyerColor}
        emissiveIntensity={0.15}
      />
      {buyers.map((point, i) => {
        const isSelected = selectedIndex === i;
        const isHovered = hoveredIndex === i;
        const scaleMultiplier = isSelected ? 1.5 : isHovered ? 1.3 : 1.0;

        return (
          <Instance
            key={`buyer-${i}`}
            position={point.position}
            scale={point.scale * scaleMultiplier}
            color={isHovered || isSelected ? '#FFFFFF' : info.buyerColor}
            onClick={(e) => {
              e.stopPropagation();
              selectCandle(selectedIndex === i ? null : i);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredIndex(i);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredIndex(null);
              document.body.style.cursor = 'auto';
            }}
          />
        );
      })}
    </Instances>
  );
}

function SellerNodes() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const selectCandle = useMarketStore((s) => s.selectCandle);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const info = ENERGY_SYMBOLS[symbol];

  const { sellers } = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  return (
    <Instances limit={sellers.length || 1}>
      <sphereGeometry args={[1, 16, 16]} />
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
            key={`seller-${i}`}
            position={point.position}
            scale={point.scale * scaleMultiplier}
            color={isHovered || isSelected ? '#FFFFFF' : info.sellerColor}
            onClick={(e) => {
              e.stopPropagation();
              selectCandle(selectedIndex === i ? null : i);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredIndex(i);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredIndex(null);
              document.body.style.cursor = 'auto';
            }}
          />
        );
      })}
    </Instances>
  );
}

function SpiralTubes() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const info = ENERGY_SYMBOLS[symbol];

  const { buyerCurve, sellerCurve } = useMemo(
    () => generateSpiralCurve(candles),
    [candles]
  );

  if (buyerCurve.length < 2) return null;

  return (
    <>
      <Line
        points={buyerCurve}
        color={info.buyerColor}
        lineWidth={1.5}
        transparent
        opacity={0.6}
      />
      <Line
        points={sellerCurve}
        color={info.sellerColor}
        lineWidth={1.5}
        transparent
        opacity={0.6}
      />
    </>
  );
}

function ConnectionBars() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const { buyers, sellers, connections } = useMemo(
    () => generateHelixData(candles, symbol),
    [candles, symbol]
  );

  if (connections.length === 0) return null;

  const step = Math.max(1, Math.floor(connections.length / 60));

  return (
    <group>
      {connections.filter((_, i) => i % step === 0).map(([bi, si], idx) => {
        if (!buyers[bi] || !sellers[si]) return null;
        const start = buyers[bi].position;
        const end = sellers[si].position;
        return (
          <Line
            key={`conn-${idx}`}
            points={[start, end]}
            color="#ffffff"
            lineWidth={0.5}
            transparent
            opacity={0.12}
          />
        );
      })}
    </group>
  );
}

function PriceLevelIndicators() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const levels = useMemo(() => {
    if (candles.length === 0) return [];

    const closes = candles.map((c) => c.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;
    const heightPerCandle = 0.35;
    const targetYRange = candles.length * heightPerCandle * 0.6;

    const numLevels = 5;
    const result: { y: number; price: number; label: string }[] = [];

    for (let i = 0; i <= numLevels; i++) {
      const frac = i / numLevels;
      const price = minPrice + frac * priceRange;
      const y = frac * targetYRange - targetYRange / 2;
      const decimals = symbol === 'CL' ? 2 : 4;
      result.push({ y, price, label: price.toFixed(decimals) });
    }

    return result;
  }, [candles, symbol]);

  if (levels.length === 0) return null;

  const zStart = 0;
  const zEnd = candles.length * 0.35;

  return (
    <group>
      {levels.map((level, i) => (
        <group key={`price-level-${i}`}>
          <Line
            points={[
              [-3, level.y, zStart],
              [-3, level.y, zEnd],
            ]}
            color="#ffffff"
            lineWidth={0.5}
            transparent
            opacity={0.08}
            dashed
            dashSize={0.2}
            gapSize={0.1}
          />
          <Html
            position={[-3.2, level.y, zEnd / 2]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-[9px] font-mono text-gray-500 whitespace-nowrap select-none">
              {level.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// Fibonacci retracement levels in 3D
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
    const allMax = Math.max(...closes);
    const allRange = allMax - allMin || 1;
    const targetYRange = candles.length * 0.35 * 0.6;

    const yForPrice = (price: number) => ((price - allMin) / allRange) * targetYRange - targetYRange / 2;

    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];

    return ratios.map((ratio, i) => ({
      y: yForPrice(low + range * ratio),
      label: labels[i],
      price: low + range * ratio,
      color: ratio === 0.618 || ratio === 0.382 ? '#9370DB' : '#6B21A8',
      opacity: ratio === 0.618 || ratio === 0.382 ? 0.3 : 0.15,
    }));
  }, [candles, symbol, showFibonacci]);

  if (fibLevels.length === 0) return null;

  const zEnd = candles.length * 0.35;

  return (
    <group>
      {fibLevels.map((level, i) => (
        <group key={`fib-${i}`}>
          <Line
            points={[[-2.5, level.y, 0], [-2.5, level.y, zEnd]]}
            color={level.color}
            lineWidth={0.8}
            transparent
            opacity={level.opacity}
          />
          <Html
            position={[-2.8, level.y, zEnd / 2]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-[8px] font-mono text-purple-400/60 whitespace-nowrap select-none">
              {level.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function SelectedCandleLabel() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const info = ENERGY_SYMBOLS[symbol];

  // Memoize the helix data to avoid re-computing during render
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
  const timeStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Html
      position={[point.position[0] + 0.5, point.position[1] + 0.3, point.position[2]]}
      center
      distanceFactor={8}
    >
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2.5 text-white min-w-[180px] shadow-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">{info.symbol}</span>
            <span className="text-[10px] text-gray-400">{timeStr}</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{changePercent}%
          </span>
        </div>

        <div className="text-base font-bold tracking-tight">{candle.close.toFixed(decimals)}</div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-white/5">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">O</span>
            <span className="text-gray-300">{candle.open.toFixed(decimals)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">H</span>
            <span className="text-green-400">{candle.high.toFixed(decimals)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">L</span>
            <span className="text-red-400">{candle.low.toFixed(decimals)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">C</span>
            <span className="text-gray-300">{candle.close.toFixed(decimals)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 pt-1 border-t border-white/5">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Vol</span>
            <span className="text-gray-300">{(candle.volume / 1000).toFixed(0)}K</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Delta</span>
            <span className={(candle.delta || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
              {((candle.delta || 0) / 1000).toFixed(1)}K
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}

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
      <SpiralTubes />
      {showConnections && <ConnectionBars />}
      <PriceLevelIndicators />
      <FibonacciLevels />
      <SelectedCandleLabel />
    </group>
  );
}
