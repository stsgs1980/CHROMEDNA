/**
 * EnergyHelix Wrapper
 * Connects independent EnergyHelix component to CHROMEDNA stores
 */

'use client';

import { EnergyHelix as EnergyHelixPure } from './energy-helix-3d';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';

export function EnergyHelix() {
  // Market data from store
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const selectedIndex = useMarketStore((s) => s.selectedCandleIndex);
  const selectCandle = useMarketStore((s) => s.selectCandle);
  
  // UI options from store
  const autoRotate = useUIStore((s) => s.autoRotate);
  const showBuyers = useUIStore((s) => s.showBuyers);
  const showSellers = useUIStore((s) => s.showSellers);
  const showConnections = useUIStore((s) => s.showConnections);
  const showFibonacci = useUIStore((s) => s.showFibonacci);
  const showEIALayer = useUIStore((s) => s.showEIALayer);
  const showWeatherLayer = useUIStore((s) => s.showWeatherLayer);
  const showVolumeProfile = useUIStore((s) => s.showVolumeProfile);

  return (
    <EnergyHelixPure
      candles={candles}
      symbol={symbol}
      selectedIndex={selectedIndex}
      options={{
        showBuyers,
        showSellers,
        showConnections,
        showFibonacci,
        showEIALayer,
        showWeatherLayer,
        showVolumeProfile,
        autoRotate,
      }}
      callbacks={{
        onCandleSelect: selectCandle,
      }}
    />
  );
}
