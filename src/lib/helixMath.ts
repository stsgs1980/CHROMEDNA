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
    heightPerCandle = 0.35,
    radius = 1.8,
    turnsPerCandle = 0.3,
  } = options;

  const info = ENERGY_SYMBOLS[symbol];
  const buyers: HelixPoint[] = [];
  const sellers: HelixPoint[] = [];
  const connections: [number, number][] = [];

  // Normalize prices to a reasonable Y range
  const prices = candles.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const targetYRange = candles.length * heightPerCandle * 0.6;
  
  // Normalize volume for scale
  const volumes = candles.map(c => c.volume);
  const maxVolume = Math.max(...volumes);
  
  candles.forEach((candle, i) => {
    const angle = i * turnsPerCandle * Math.PI * 2;
    const z = i * heightPerCandle;
    const y = ((candle.close - minPrice) / priceRange) * targetYRange - targetYRange / 2;
    const volumeScale = 0.03 + (candle.volume / maxVolume) * 0.12;
    
    // Buyer node (upper spiral)
    buyers.push({
      position: [
        Math.cos(angle) * radius,
        y + 0.05,
        z
      ],
      color: info.buyerColor,
      scale: volumeScale * (1 + (candle.buyVolume || candle.volume * 0.5) / candle.volume * 0.3),
      candle,
      index: i,
    });

    // Seller node (lower spiral, offset by π)
    sellers.push({
      position: [
        Math.cos(angle + Math.PI) * radius,
        y - 0.05,
        z
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
    heightPerCandle = 0.35,
    radius = 1.8,
    turnsPerCandle = 0.3,
  } = options;

  const prices = candles.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const targetYRange = candles.length * heightPerCandle * 0.6;

  const buyerCurve: [number, number, number][] = [];
  const sellerCurve: [number, number, number][] = [];

  candles.forEach((candle, i) => {
    const angle = i * turnsPerCandle * Math.PI * 2;
    const z = i * heightPerCandle;
    const y = ((candle.close - minPrice) / priceRange) * targetYRange - targetYRange / 2;

    buyerCurve.push([Math.cos(angle) * radius, y + 0.05, z]);
    sellerCurve.push([Math.cos(angle + Math.PI) * radius, y - 0.05, z]);
  });

  return { buyerCurve, sellerCurve };
}
