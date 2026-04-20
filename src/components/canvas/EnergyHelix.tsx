'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { generateHelixData, generateSpiralCurve } from '@/lib/helixMath';
import { ENERGY_SYMBOLS } from '@/types/energy';

const HEIGHT_PER_CANDLE = 0.22;
const HELIX_RADIUS = 2.2;
const TURNS_PER_CANDLE = 0.1;

// Buyer nodes on one spiral
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
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={info.buyerColor}
        metalness={0.9}
        roughness={0.1}
        emissive={info.buyerColor}
        emissiveIntensity={0.3}
      />
      {buyers.map((point, i) => {
        const isSelected = selectedIndex === i;
        const isHovered = hoveredIndex === i;
        const scaleMultiplier = isSelected ? 2.0 : isHovered ? 1.5 : 1.0;

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

// Seller nodes on the other spiral
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
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={info.sellerColor}
        metalness={0.85}
        roughness={0.15}
        emissive={info.sellerColor}
        emissiveIntensity={0.2}
      />
      {sellers.map((point, i) => {
        const isSelected = selectedIndex === i;
        const isHovered = hoveredIndex === i;
        const scaleMultiplier = isSelected ? 2.0 : isHovered ? 1.5 : 1.0;

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

// Spiral backbone - smooth tube geometry using CatmullRomCurve3
function SpiralBackbone() {
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
      {/* Buyer spiral tube - gold/amber metallic */}
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

      {/* Seller spiral tube - copper/red metallic */}
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

// DNA ladder rungs connecting buyer and seller strands (using instanced cylinders)
function ConnectionBars() {
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

// Price level indicators with glow planes at key levels
function PriceLevelIndicators() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Standard grid levels
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
        z: frac * 3 - 1.5, // targetZRange = 3
        label: (minPrice + frac * priceRange).toFixed(decimals),
      });
    }
    return result;
  }, [candles, symbol]);

  // Key price level glow planes (high, low, current)
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

  // Pulse animation for current price plane
  useFrame((state) => {
    if (materialRef.current) {
      const pulse = 0.08 + Math.sin(state.clock.elapsedTime * 1.5) * 0.06;
      materialRef.current.opacity = pulse;
    }
  });

  if (levels.length === 0) return null;
  const yEnd = candles.length * HEIGHT_PER_CANDLE;
  const planeWidth = HELIX_RADIUS * 2 + 1; // span helix diameter + margin

  return (
    <group>
      {/* Standard grid level lines */}
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
      {/* Key price level glow planes */}
      {keyLevels.map((level, i) => (
        <mesh key={`glow-plane-${i}`} position={[0, yEnd / 2, level.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[planeWidth, yEnd]} />
          {level.type === 'current' ? (
            <meshBasicMaterial
              ref={materialRef}
              color={level.color}
              transparent
              opacity={level.opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          ) : (
            <meshStandardMaterial
              color={level.color}
              transparent
              opacity={level.opacity}
              emissive={level.color}
              emissiveIntensity={level.emissiveIntensity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          )}
        </mesh>
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
    const yForPrice = (price: number) => ((price - allMin) / allRange) * 3 - 1.5;
    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
    return ratios.map((ratio, i) => ({
      z: yForPrice(low + range * ratio),
      label: labels[i],
      color: ratio === 0.618 || ratio === 0.382 ? '#9370DB' : '#6B21A8',
      opacity: ratio === 0.618 || ratio === 0.382 ? 0.25 : 0.1,
    }));
  }, [candles, symbol, showFibonacci]);

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

// Glowing selection ring and vertical beam for selected candle
function SelectionRing() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const helixData = useMemo(() => generateHelixData(candles, symbol), [candles, symbol]);

  const buyerRingRef = useRef<THREE.Mesh>(null);
  const sellerRingRef = useRef<THREE.Mesh>(null);
  const buyerGlowRef = useRef<THREE.Mesh>(null);
  const sellerGlowRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    // Pulse opacity: 0.8 -> 0.3 -> 0.8
    const pulseOpacity = 0.55 + Math.sin(time * 3) * 0.25;
    // Ring expansion: subtle scale pulse
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

    // Beam opacity
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(time * 4) * 0.1;
    }
  });

  if (selectedIndex === null || !candles[selectedIndex]) return null;
  const buyerPoint = helixData.buyers[selectedIndex];
  const sellerPoint = helixData.sellers[selectedIndex];
  if (!buyerPoint || !sellerPoint) return null;

  const beamHeight = buyerPoint.position[1] + 1; // from node to grid floor at Y=-1

  return (
    <group>
      {/* Buyer side selection ring */}
      <mesh ref={buyerRingRef} position={buyerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.025, 8, 48]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={1.2}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Buyer outer glow ring */}
      <mesh ref={buyerGlowRef} position={buyerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.08, 6, 48]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} />
      </mesh>

      {/* Seller side selection ring */}
      <mesh ref={sellerRingRef} position={sellerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.025, 8, 48]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={1.2}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Seller outer glow ring */}
      <mesh ref={sellerGlowRef} position={sellerPoint.position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.08, 6, 48]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} />
      </mesh>

      {/* Vertical beam of light from buyer node to grid floor */}
      <mesh ref={beamRef} position={[buyerPoint.position[0], buyerPoint.position[1] - beamHeight / 2, buyerPoint.position[2]]}>
        <cylinderGeometry args={[0.015, 0.015, beamHeight, 6]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} />
      </mesh>
      {/* Vertical beam from seller node to grid floor */}
      <mesh position={[sellerPoint.position[0], sellerPoint.position[1] - beamHeight / 2, sellerPoint.position[2]]}>
        <cylinderGeometry args={[0.015, 0.015, beamHeight, 6]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.15} />
      </mesh>
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
    <Html position={[point.position[0] + 1, point.position[1] + 0.3, point.position[2]]} center distanceFactor={8}>
      <div className="bg-gray-900/95 backdrop-blur-md border border-amber-500/30 rounded-lg px-3 py-2.5 text-white min-w-[180px] shadow-2xl shadow-amber-500/10">
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

// EIA Day Markers - glowing rings on Wednesday candles (EIA report days)
function EIADayMarkers() {
  const showEIALayer = useUIStore((s) => s.showEIALayer);
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

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
  }, [candles, symbol, showEIALayer]);

  if (!showEIALayer || eiaCandles.length === 0) return null;

  // Limit to a reasonable number for performance
  const visibleMarkers = eiaCandles;

  return (
    <group>
      {visibleMarkers.map((marker) => (
        <group key={`eia-${marker.index}`}>
          {/* Glowing torus ring */}
          <mesh position={[0, marker.y, marker.z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[HELIX_RADIUS, 0.03, 8, 48]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFA500"
              emissiveIntensity={0.8}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Inner glow ring */}
          <mesh position={[0, marker.y, marker.z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[HELIX_RADIUS, 0.08, 6, 48]} />
            <meshBasicMaterial
              color="#FFA500"
              transparent
              opacity={0.15}
            />
          </mesh>
          {/* EIA label */}
          <Html
            position={[HELIX_RADIUS + 0.8, marker.y, marker.z]}
            center
            distanceFactor={8}
            style={{ pointerEvents: 'none' }}
          >
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

// Weather Impact Particles - floating particles near high weather impact candles
function WeatherParticles() {
  const showWeatherLayer = useUIStore((s) => s.showWeatherLayer);
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
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
      if (impact < 25) return; // Only show particles for significant weather impact

      const y = i * HEIGHT_PER_CANDLE;
      const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;
      const angle = i * TURNS_PER_CANDLE * Math.PI * 2;

      // Number of particles scales with impact
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
  }, [candles, symbol, showWeatherLayer]);

  useFrame((state) => {
    if (!meshRef.current || count === 0) return;
    const time = state.clock.elapsedTime;
    const dummy = dummyRef.current;

    particles.forEach((p, i) => {
      // Float upward gently, oscillate horizontally
      const floatY = p.y + Math.sin(time * p.speed + p.phase) * 0.08;
      const floatX = p.x + Math.cos(time * p.speed * 0.7 + p.phase) * 0.04;
      const floatZ = p.z + Math.sin(time * p.speed * 0.5 + p.phase) * 0.04;
      dummy.position.set(floatX, floatY, floatZ);
      // Size scales with impact, pulses gently
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
      <meshStandardMaterial
        color="#FF6B35"
        emissive="#FF4500"
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
      />
    </instancedMesh>
  );
}

// Ambient Glow Ring - large semi-transparent torus at helix center
function AmbientGlowRing() {
  const candles = useMarketStore((s) => s.candles);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const midHeight = useMemo(() => {
    if (candles.length === 0) return 0;
    return (candles.length * HEIGHT_PER_CANDLE) / 2;
  }, [candles]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (materialRef.current) {
      // Pulse opacity between 0.05 and 0.08
      materialRef.current.opacity = 0.06 + Math.sin(time * 0.5) * 0.02;
    }
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.z = time * 0.05;
      meshRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;
    }
  });

  const ringRadius = HELIX_RADIUS + 1.5;

  return (
    <mesh ref={meshRef} position={[0, midHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[ringRadius, 0.15, 8, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#FFD700"
        transparent
        opacity={0.06}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 3D Volume Heatmap Layer - cylindrical ring segments showing volume intensity around the DNA helix
function VolumeHeatmap() {
  const showVolumeProfile = useUIStore((s) => s.showVolumeProfile);
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Compute volume data for each candle - sample to limit instances for performance
  const volumeData = useMemo(() => {
    if (!showVolumeProfile || candles.length === 0) return [];

    const maxVolume = Math.max(...candles.map(c => c.volume));

    // Sample every Nth candle to limit total rings (max ~60)
    const step = Math.max(1, Math.floor(candles.length / 60));

    const result: { y: number; normalizedVol: number; index: number }[] = [];
    for (let i = 0; i < candles.length; i += step) {
      const candle = candles[i];
      const y = i * HEIGHT_PER_CANDLE;
      const normalizedVol = candle.volume / maxVolume; // 0 to 1
      result.push({ y, normalizedVol, index: i });
    }
    return result;
  }, [candles, symbol, showVolumeProfile]);

  // Animate: pulse each ring's opacity
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    materialRefs.current.forEach((mat, i) => {
      if (!mat || !volumeData[i]) return;
      // Each ring pulses with a phase offset based on its position
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
        // Color gradient: low volume = dim amber, high volume = bright amber/white
        const volColor = d.normalizedVol > 0.8
          ? '#fff7ed'  // near white for very high volume
          : d.normalizedVol > 0.5
            ? '#fbbf24' // bright amber for high volume
            : '#92400e'; // dim amber for low volume

        const emissiveIntensity = 0.2 + d.normalizedVol * 0.8;
        const tubeRadius = 0.015 + d.normalizedVol * 0.04; // thicker for higher volume

        return (
          <mesh
            key={`vh-${d.index}`}
            position={[0, d.y, 0]}
          >
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

// Main helix component
export function EnergyHelix() {
  const groupRef = useRef<THREE.Group>(null);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const showBuyers = useUIStore((s) => s.showBuyers);
  const showSellers = useUIStore((s) => s.showSellers);
  const showConnections = useUIStore((s) => s.showConnections);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {showBuyers && <BuyerNodes />}
      {showSellers && <SellerNodes />}
      <SpiralBackbone />
      {showConnections && <ConnectionBars />}
      <PriceLevelIndicators />
      <FibonacciLevels />
      <SelectionRing />
      <SelectedCandleLabel />
      <EIADayMarkers />
      <WeatherParticles />
      <VolumeHeatmap />
      <AmbientGlowRing />
    </group>
  );
}
