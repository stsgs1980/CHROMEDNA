'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
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
        const glowFactor = isSelected ? 2.0 : isHovered ? 1.5 : 1.0;
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
          >
            {/* Glow ring on hover/select */}
            {(isHovered || isSelected) && (
              <mesh scale={1.6}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial
                  color={info.buyerColor}
                  transparent
                  opacity={isSelected ? 0.25 : 0.15}
                />
              </mesh>
            )}
          </Instance>
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
          >
            {(isHovered || isSelected) && (
              <mesh scale={1.6}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial
                  color={info.sellerColor}
                  transparent
                  opacity={isSelected ? 0.25 : 0.15}
                />
              </mesh>
            )}
          </Instance>
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

  // Only render every Nth connection for performance
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

    // Generate 5 price levels
    const numLevels = 5;
    const result: { y: number; price: number; label: string }[] = [];

    for (let i = 0; i <= numLevels; i++) {
      const frac = i / numLevels;
      const price = minPrice + frac * priceRange;
      const y = frac * targetYRange - targetYRange / 2;
      const decimals = symbol === 'CL' ? 2 : 4;
      result.push({
        y,
        price,
        label: price.toFixed(decimals),
      });
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
          {/* Horizontal line across the helix Z extent */}
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
          {/* Price label */}
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

function SelectedCandleLabel() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const info = ENERGY_SYMBOLS[symbol];

  if (selectedIndex === null || !candles[selectedIndex]) return null;

  const helixData = generateHelixData(candles, symbol);
  const point = helixData.buyers[selectedIndex];
  if (!point) return null;

  const candle = candles[selectedIndex];
  const change = candle.close - candle.open;
  const changePercent = ((change / candle.open) * 100).toFixed(2);
  const isUp = change >= 0;
  const decimals = symbol === 'CL' ? 2 : 4;

  // Format timestamp
  const date = new Date(candle.time * 1000);
  const timeStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Html
      position={[point.position[0] + 0.5, point.position[1] + 0.3, point.position[2]]}
      center
      distanceFactor={8}
    >
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 text-white min-w-[200px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">{info.symbol}</span>
            <span className="text-[10px] text-gray-400">{timeStr}</span>
          </div>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}
            {changePercent}%
          </span>
        </div>

        {/* Price */}
        <div className="text-lg font-bold tracking-tight">{candle.close.toFixed(decimals)}</div>
        <div className={`text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? '+' : ''}
          {change.toFixed(decimals)}
        </div>

        {/* OHLCV Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 pt-2 border-t border-white/5">
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

        {/* Volume & Delta */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-white/5">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Vol</span>
            <span className="text-gray-300">{(candle.volume / 1000).toFixed(0)}K</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">OI</span>
            <span className="text-gray-300">{(candle.openInterest / 1000).toFixed(1)}K</span>
          </div>
          {(candle.delta !== undefined) && (
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Delta</span>
              <span className={candle.delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                {candle.delta >= 0 ? '+' : ''}{candle.delta?.toFixed(0)}
              </span>
            </div>
          )}
          {(candle.buyVolume !== undefined) && (
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Buy</span>
              <span className="text-green-400">{(candle.buyVolume! / 1000).toFixed(0)}K</span>
            </div>
          )}
        </div>

        {/* Energy Metrics */}
        {(candle.eiaExpectation || candle.weatherImpact !== undefined || candle.seasonalFactor !== undefined) && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-white/5">
            {candle.eiaExpectation && (
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">EIA</span>
                <span className={`capitalize ${
                  candle.eiaExpectation === 'build' ? 'text-red-400' :
                  candle.eiaExpectation === 'draw' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {candle.eiaExpectation}
                </span>
              </div>
            )}
            {candle.weatherImpact !== undefined && (
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Wx</span>
                <span className={candle.weatherImpact >= 0 ? 'text-amber-400' : 'text-cyan-400'}>
                  {candle.weatherImpact > 0 ? '+' : ''}{candle.weatherImpact}
                </span>
              </div>
            )}
          </div>
        )}
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
      <SelectedCandleLabel />
    </group>
  );
}
