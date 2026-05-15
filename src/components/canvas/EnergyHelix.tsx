'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '@/stores/uiStore';
import { BuyerNodes, SellerNodes } from './helix/HelixNodes';
import { SpiralBackbone, ConnectionBars } from './helix/HelixBackbone';
import { PriceLevelIndicators, FibonacciLevels } from './helix/HelixIndicators';
import { SelectionRing, SelectedCandleLabel } from './helix/HelixSelection';
import { EIADayMarkers, WeatherParticles } from './helix/HelixMarkers';
import { VolumeHeatmap, AmbientGlowRing, PulsingEnergyCore, ConnectingEnergyArcs } from './helix/HelixEffects';

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
      <PulsingEnergyCore />
      <ConnectingEnergyArcs />
    </group>
  );
}
