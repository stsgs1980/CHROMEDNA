'use client';

import { useMemo, useState } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { useMarketStore } from '@/stores/marketStore';
import { generateHelixData } from '@/lib/helixMath';
import { ENERGY_SYMBOLS } from '@/types/energy';

export function BuyerNodes() {
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

export function SellerNodes() {
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
