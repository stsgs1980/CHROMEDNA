/**
 * EnergyHelix 3D - Main Component
 * Independent 3D visualization for energy futures
 */

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EnergyHelixProps, HelixDisplayOptions } from './types';
import { BuyerNodes, SellerNodes } from './Nodes';
import { SpiralBackbone, ConnectionBars } from './Backbone';
import { PriceLevelIndicators, FibonacciLevels } from './Indicators';
import { EIADayMarkers, WeatherParticles } from './Markers';
import { SelectionRing, SelectedCandleLabel } from './Selection';
import { VolumeHeatmap, AmbientGlowRing, PulsingEnergyCore, ConnectingEnergyArcs } from './Effects';

const DEFAULT_OPTIONS: HelixDisplayOptions = {
  showBuyers: true,
  showSellers: true,
  showConnections: true,
  showFibonacci: true,
  showEIALayer: true,
  showWeatherLayer: true,
  showVolumeProfile: true,
  autoRotate: true,
};

export function EnergyHelix({
  candles,
  symbol,
  selectedIndex = null,
  options = {},
  callbacks = {},
}: EnergyHelixProps) {
  const groupRef = useRef<THREE.Group>(null);
  const opts = { ...DEFAULT_OPTIONS, ...options };

  useFrame((_, delta) => {
    if (groupRef.current && opts.autoRotate) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  const handleSelect = (index: number | null) => {
    callbacks.onCandleSelect?.(index);
  };

  return (
    <group ref={groupRef}>
      {opts.showBuyers && (
        <BuyerNodes
          candles={candles}
          symbol={symbol}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
      )}
      {opts.showSellers && (
        <SellerNodes
          candles={candles}
          symbol={symbol}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
      )}
      <SpiralBackbone candles={candles} symbol={symbol} />
      {opts.showConnections && <ConnectionBars candles={candles} symbol={symbol} />}
      <PriceLevelIndicators candles={candles} symbol={symbol} />
      <FibonacciLevels candles={candles} showFibonacci={opts.showFibonacci ?? false} />
      <SelectionRing candles={candles} symbol={symbol} selectedIndex={selectedIndex} />
      <SelectedCandleLabel candles={candles} symbol={symbol} selectedIndex={selectedIndex} />
      <EIADayMarkers candles={candles} showEIALayer={opts.showEIALayer ?? false} />
      <WeatherParticles candles={candles} showWeatherLayer={opts.showWeatherLayer ?? false} />
      <VolumeHeatmap candles={candles} showVolumeProfile={opts.showVolumeProfile ?? false} />
      <AmbientGlowRing candles={candles} />
      <PulsingEnergyCore candles={candles} />
      <ConnectingEnergyArcs candles={candles} symbol={symbol} />
    </group>
  );
}
