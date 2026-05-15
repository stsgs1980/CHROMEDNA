/**
 * EnergyHelix 3D - Helix Math Utilities
 * Pure functions for helix data generation
 */

import { HelixCandle, HelixSymbol, HelixPoint, HelixData, HELIX_SYMBOLS } from './types';

export interface HelixMathOptions {
  heightPerCandle?: number;
  radius?: number;
  turnsPerCandle?: number;
}

const DEFAULT_OPTIONS: Required<HelixMathOptions> = {
  heightPerCandle: 0.22,
  radius: 2.2,
  turnsPerCandle: 0.1,
};

export function generateHelixData(
  candles: HelixCandle[],
  symbol: HelixSymbol,
  options: HelixMathOptions = {}
): HelixData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const info = HELIX_SYMBOLS[symbol];
  const buyers: HelixPoint[] = [];
  const sellers: HelixPoint[] = [];
  const connections: [number, number][] = [];

  if (candles.length === 0) {
    return { buyers, sellers, connections };
  }

  // Normalize prices to Z-axis range
  const prices = candles.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const targetZRange = 3;
  
  // Normalize volume for scale
  const volumes = candles.map(c => c.volume);
  const maxVolume = Math.max(...volumes);
  
  candles.forEach((candle, i) => {
    const angle = i * opts.turnsPerCandle * Math.PI * 2;
    const y = i * opts.heightPerCandle;
    const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;
    const volumeScale = 0.12 + (candle.volume / maxVolume) * 0.3;
    
    // Buyer node
    buyers.push({
      position: [
        Math.cos(angle) * opts.radius,
        y,
        z + 0.15
      ],
      color: info.buyerColor,
      scale: volumeScale * (1 + (candle.buyVolume || candle.volume * 0.5) / candle.volume * 0.3),
      candle,
      index: i,
    });

    // Seller node
    sellers.push({
      position: [
        Math.cos(angle + Math.PI) * opts.radius,
        y,
        z - 0.15
      ],
      color: info.sellerColor,
      scale: volumeScale * (1 + (candle.sellVolume || candle.volume * 0.5) / candle.volume * 0.3),
      candle,
      index: i,
    });
    
    connections.push([i, i]);
  });

  return { buyers, sellers, connections };
}

export function generateSpiralCurve(
  candles: HelixCandle[],
  options: HelixMathOptions = {}
): { buyerCurve: [number, number, number][]; sellerCurve: [number, number, number][] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (candles.length === 0) {
    return { buyerCurve: [], sellerCurve: [] };
  }

  const prices = candles.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const targetZRange = 3;

  const buyerCurve: [number, number, number][] = [];
  const sellerCurve: [number, number, number][] = [];

  candles.forEach((candle, i) => {
    const angle = i * opts.turnsPerCandle * Math.PI * 2;
    const y = i * opts.heightPerCandle;
    const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;

    buyerCurve.push([Math.cos(angle) * opts.radius, y, z + 0.15]);
    sellerCurve.push([Math.cos(angle + Math.PI) * opts.radius, y, z - 0.15]);
  });

  return { buyerCurve, sellerCurve };
}

// Constants for components
export const HELIX_CONSTANTS = {
  HEIGHT_PER_CANDLE: 0.22,
  TURNS_PER_CANDLE: 0.1,
  HELIX_RADIUS: 2.2,
  TARGET_Z_RANGE: 3,
} as const;
