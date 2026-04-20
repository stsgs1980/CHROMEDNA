import { EnergyCandle } from '@/types/market';
import { EnergySymbol, EIAExpectation, TrendDirection } from '@/types/energy';
import { ENERGY_SYMBOLS } from '@/types/energy';

export function generateEnergyData(
  symbol: EnergySymbol,
  days: number = 200,
  options?: { startPrice?: number; trend?: TrendDirection }
): EnergyCandle[] {
  const info = ENERGY_SYMBOLS[symbol];
  const price = options?.startPrice ?? info.basePrice;
  const volatility = info.volatility;
  const data: EnergyCandle[] = [];
  
  let currentPrice = price;
  const now = Date.now();
  const msPerDay = 86400000;
  const startDate = now - days * msPerDay;

  // Trend bias
  const trendBias = options?.trend === 'bull' ? 0.0003 : 
                    options?.trend === 'bear' ? -0.0003 : 0;

  for (let i = 0; i < days; i++) {
    const timestamp = startDate + i * msPerDay;
    const date = new Date(timestamp);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const month = date.getMonth();
    
    // Seasonal factor (especially for NG)
    let seasonalFactor = 1;
    if (symbol === 'NG') {
      seasonalFactor = (month >= 10 || month <= 2) ? 1.3 : 0.85;
    } else if (symbol === 'HO') {
      seasonalFactor = (month >= 10 || month <= 2) ? 1.15 : 0.9;
    } else if (symbol === 'RB') {
      seasonalFactor = (month >= 4 && month <= 8) ? 1.2 : 0.9; // Summer driving
    }
    
    // EIA effect (Wednesday)
    const isWednesday = date.getDay() === 3;
    const eiaVolatilityBoost = isWednesday ? 1.5 : 1;
    
    // EIA expectation
    let eiaExpectation: EIAExpectation | undefined;
    if (isWednesday) {
      const rand = Math.random();
      eiaExpectation = rand < 0.35 ? 'build' : rand < 0.7 ? 'draw' : 'neutral';
    }
    
    // Weather impact (rare extreme events)
    const weatherEvent = Math.random() > 0.93;
    const weatherImpact = weatherEvent 
      ? (Math.random() - 0.5) * 100 
      : (Math.random() - 0.5) * 15;
    
    // Generate candle
    const dayVol = volatility * eiaVolatilityBoost * seasonalFactor;
    const trendComponent = trendBias * currentPrice;
    const change = (Math.random() - 0.5) * 2 * dayVol * currentPrice + trendComponent;
    
    const open = currentPrice;
    const close = open + change;
    const wickUp = Math.abs(change) * (0.2 + Math.random() * 0.8);
    const wickDown = Math.abs(change) * (0.2 + Math.random() * 0.8);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    // Volume (higher on EIA days, varies by contract)
    const baseVolume = symbol === 'CL' ? 250000 : 
                       symbol === 'NG' ? 400000 : 
                       symbol === 'RB' ? 120000 : 80000;
    const volumeMultiplier = 0.5 + Math.random() * 1.5;
    const volume = Math.floor(baseVolume * volumeMultiplier * (isWednesday ? 2 : 1));
    
    // Open Interest
    const oiBase = symbol === 'CL' ? 500000 : 300000;
    const openInterest = Math.floor(oiBase * (0.7 + Math.random() * 0.6));
    
    // Buy/Sell volume split
    const buyRatio = 0.3 + Math.random() * 0.4; // 30-70%
    const buyVolume = Math.floor(volume * buyRatio);
    const sellVolume = volume - buyVolume;

    const candle: EnergyCandle = {
      time: timestamp,
      open: parseFloat(open.toFixed(symbol === 'CL' ? 2 : 4)),
      high: parseFloat(high.toFixed(symbol === 'CL' ? 2 : 4)),
      low: parseFloat(low.toFixed(symbol === 'CL' ? 2 : 4)),
      close: parseFloat(close.toFixed(symbol === 'CL' ? 2 : 4)),
      volume,
      openInterest,
      eiaExpectation,
      weatherImpact: parseFloat(weatherImpact.toFixed(1)),
      seasonalFactor: parseFloat(seasonalFactor.toFixed(2)),
      delta: buyVolume - sellVolume,
      buyVolume,
      sellVolume,
    };
    
    data.push(candle);
    currentPrice = close;
    
    // Mean reversion guard
    if (currentPrice < price * 0.5) currentPrice = price * 0.6;
    if (currentPrice > price * 2) currentPrice = price * 1.8;
  }

  return data;
}

export function generateVolumeProfile(candles: EnergyCandle[], bins: number = 30) {
  if (!candles.length) return null;
  
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const step = (maxPrice - minPrice) / bins;
  
  const levels = Array.from({ length: bins }, (_, i) => ({
    price: parseFloat((minPrice + i * step).toFixed(4)),
    volume: 0,
    tpoCount: 0,
    delta: 0,
  }));
  
  let maxVol = 0;
  let pocIndex = 0;
  
  candles.forEach(candle => {
    const lowIdx = Math.max(0, Math.floor((candle.low - minPrice) / step));
    const highIdx = Math.min(bins - 1, Math.ceil((candle.high - minPrice) / step));
    
    for (let i = lowIdx; i <= highIdx; i++) {
      const volShare = candle.volume / (highIdx - lowIdx + 1);
      levels[i].volume += volShare;
      levels[i].tpoCount += 1;
      levels[i].delta += (candle.delta || 0) / (highIdx - lowIdx + 1);
      
      if (levels[i].volume > maxVol) {
        maxVol = levels[i].volume;
        pocIndex = i;
      }
    }
  });
  
  // Value Area (70% of volume)
  const totalVolume = levels.reduce((sum, l) => sum + l.volume, 0);
  let vaVolume = 0;
  let vaLow = pocIndex;
  let vaHigh = pocIndex;
  
  while (vaVolume < totalVolume * 0.7) {
    const belowVol = vaLow > 0 ? levels[vaLow - 1].volume : 0;
    const aboveVol = vaHigh < bins - 1 ? levels[vaHigh + 1].volume : 0;
    
    if (belowVol > aboveVol && vaLow > 0) {
      vaLow--;
      vaVolume += belowVol;
    } else if (vaHigh < bins - 1) {
      vaHigh++;
      vaVolume += aboveVol;
    } else {
      break;
    }
  }
  
  return {
    levels,
    poc: levels[pocIndex].price,
    vah: levels[vaHigh].price,
    val: levels[vaLow].price,
  };
}

export function generateOrderFlow(candles: EnergyCandle[], bins: number = 20) {
  if (!candles.length) return null;
  
  const prices = candles.slice(-20).flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const step = (maxPrice - minPrice) / bins;
  
  const levels = Array.from({ length: bins }, (_, i) => ({
    price: parseFloat((minPrice + i * step).toFixed(4)),
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    imbalance: undefined as 'buy' | 'sell' | undefined,
  }));
  
  // Simulate order flow from recent candles
  candles.slice(-5).forEach(candle => {
    const lowIdx = Math.max(0, Math.floor((candle.low - minPrice) / step));
    const highIdx = Math.min(bins - 1, Math.ceil((candle.high - minPrice) / step));
    
    for (let i = lowIdx; i <= highIdx; i++) {
      const buyShare = (candle.buyVolume || 0) / (highIdx - lowIdx + 1);
      const sellShare = (candle.sellVolume || 0) / (highIdx - lowIdx + 1);
      levels[i].buyVolume += buyShare;
      levels[i].sellVolume += sellShare;
      levels[i].delta = levels[i].buyVolume - levels[i].sellVolume;
      
      // Imbalance detection
      if (levels[i].buyVolume > levels[i].sellVolume * 3) {
        levels[i].imbalance = 'buy';
      } else if (levels[i].sellVolume > levels[i].buyVolume * 3) {
        levels[i].imbalance = 'sell';
      }
    }
  });
  
  const cumulativeDelta = levels.reduce((sum, l) => sum + l.delta, 0);
  
  // Generate some large trades
  const largeTrades = candles.slice(-10).filter(c => c.volume > 100000).map(c => ({
    price: c.close,
    quantity: Math.floor(c.volume * (0.1 + Math.random() * 0.3)),
    side: (c.delta || 0) > 0 ? 'buy' as const : 'sell' as const,
    timestamp: c.time,
  }));
  
  return {
    levels,
    cumulativeDelta: parseFloat(cumulativeDelta.toFixed(0)),
    largeTrades,
    velocity: parseFloat((Math.random() * 500 + 100).toFixed(0)),
  };
}
