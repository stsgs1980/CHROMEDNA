'use client';

import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/stores/marketStore';
import { ENERGY_SYMBOLS } from '@/types/energy';
import type { EnergyCandle } from '@/types/market';

/**
 * LiveTickSimulator — invisible component that simulates real-time price ticks
 * when Live mode is enabled. Every 3-5 seconds (random interval), it applies
 * a small random price movement to the latest candle.
 */
export function LiveTickSimulator() {
  const isLive = useMarketStore((s) => s.isLive);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLive) {
      // Clean up when live mode is turned off
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    function scheduleNext() {
      // Random interval between 3-5 seconds
      const delay = 3000 + Math.random() * 2000;
      timeoutRef.current = setTimeout(() => {
        tick();
        if (useMarketStore.getState().isLive) {
          scheduleNext();
        }
      }, delay);
    }

    function tick() {
      const state = useMarketStore.getState();
      const candles = state.candles;
      if (candles.length === 0) return;

      const symbol = state.symbol;
      const info = ENERGY_SYMBOLS[symbol];
      const volatility = info.volatility;

      // Clone the candles array and modify the last candle
      const updated: EnergyCandle[] = [...candles];
      const last = { ...updated[updated.length - 1] };

      // Small random price movement based on symbol volatility
      const movement = (Math.random() - 0.5) * 2 * volatility * 0.3 * last.close;
      const newClose = last.close + movement;

      // Round to appropriate precision
      const precision = symbol === 'CL' ? 2 : 4;
      last.close = parseFloat(newClose.toFixed(precision));

      // Occasionally update high/low if the new close exceeds them
      if (last.close > last.high) {
        last.high = parseFloat(last.close.toFixed(precision));
      }
      if (last.close < last.low) {
        last.low = parseFloat(last.close.toFixed(precision));
      }

      // Add small volume increment
      const volIncrement = Math.floor(
        (symbol === 'CL' ? 500 : symbol === 'NG' ? 800 : symbol === 'RB' ? 200 : 150) *
        (0.5 + Math.random())
      );
      last.volume += volIncrement;
      last.openInterest += Math.floor(volIncrement * 0.1 * (Math.random() - 0.3));

      // Update delta slightly
      const deltaShift = Math.floor(volIncrement * (Math.random() - 0.5));
      last.delta = (last.delta || 0) + deltaShift;
      if (last.buyVolume !== undefined) {
        last.buyVolume = (last.buyVolume || 0) + Math.floor(volIncrement * 0.5 + deltaShift * 0.5);
      }
      if (last.sellVolume !== undefined) {
        last.sellVolume = (last.sellVolume || 0) + Math.floor(volIncrement * 0.5 - deltaShift * 0.5);
      }

      updated[updated.length - 1] = last;
      useMarketStore.setState({ candles: updated });
    }

    scheduleNext();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLive]);

  return null;
}
