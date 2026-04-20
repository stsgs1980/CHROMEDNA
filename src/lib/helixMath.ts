import { EnergyCandle, HelixPoint, HelixData } from '@/types/market';
import { EnergySymbol, ENERGY_SYMBOLS } from '@/types/energy';

export interface HelixOptions {
  heightPerCandle?: number;
  radius?: number;
  turnsPerCandle?: number;
  priceScale?: number;
}

export function generateHelixData(
  candles: EnergyCandle[],
  symbol: EnergySymbol,
  options: HelixOptions = {}
): HelixData {
  const {
    heightPerCandle = 0.22,
    radius = 2.2,
    turnsPerCandle = 0.1,
  } = options;

  const info = ENERGY_SYMBOLS[symbol];
  const buyers: HelixPoint[] = [];
  const sellers: HelixPoint[] = [];
  const connections: [number, number][] = [];

  // Normalize prices to Z-axis range (depth)
  const prices = candles.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const targetZRange = 3; // Price creates depth variation
  
  // Normalize volume for scale
  const volumes = candles.map(c => c.volume);
  const maxVolume = Math.max(...volumes);
  
  candles.forEach((candle, i) => {
    const angle = i * turnsPerCandle * Math.PI * 2;
    // Y-axis = time (helix extends upward)
    const y = i * heightPerCandle;
    // Z-axis = price (creates depth)
    const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;
    const volumeScale = 0.12 + (candle.volume / maxVolume) * 0.3;
    
    // Buyer node (one spiral)
    buyers.push({
      position: [
        Math.cos(angle) * radius,  // X = spiral radius
        y,                          // Y = time (upward)
        z + 0.15                    // Z = price (depth) + offset
      ],
      color: info.buyerColor,
      scale: volumeScale * (1 + (candle.buyVolume || candle.volume * 0.5) / candle.volume * 0.3),
      candle,
      index: i,
    });

    // Seller node (other spiral, offset by π)
    sellers.push({
      position: [
        Math.cos(angle + Math.PI) * radius,  // X = opposite side
        y,                                     // Y = same time
        z - 0.15                               // Z = price - offset
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

// Generate spiral curve points for smooth tube rendering
export function generateSpiralCurve(
  candles: EnergyCandle[],
  options: HelixOptions = {}
): { buyerCurve: [number, number, number][]; sellerCurve: [number, number, number][] } {
  const {
    heightPerCandle = 0.22,
    radius = 2.2,
    turnsPerCandle = 0.1,
  } = options;

  const prices = candles.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const targetZRange = 3;

  const buyerCurve: [number, number, number][] = [];
  const sellerCurve: [number, number, number][] = [];

  candles.forEach((candle, i) => {
    const angle = i * turnsPerCandle * Math.PI * 2;
    const y = i * heightPerCandle;
    const z = ((candle.close - minPrice) / priceRange) * targetZRange - targetZRange / 2;

    buyerCurve.push([Math.cos(angle) * radius, y, z + 0.15]);
    sellerCurve.push([Math.cos(angle + Math.PI) * radius, y, z - 0.15]);
  });

  return { buyerCurve, sellerCurve };
}
