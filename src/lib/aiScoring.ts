import { EnergyCandle, AICompositeScore, ScoreComponent } from '@/types/market';
import { SignalType } from '@/types/energy';

export function calculateCompositeScore(candles: EnergyCandle[]): AICompositeScore {
  if (candles.length < 10) {
    return { score: 50, signal: 'NEUTRAL', confidence: 0, components: [] };
  }

  const recent = candles.slice(-20);
  const latest = recent[recent.length - 1];
  const components: ScoreComponent[] = [];

  // 1. Trend Score (20%)
  const sma5 = recent.slice(-5).reduce((s, c) => s + c.close, 0) / 5;
  const sma20 = recent.reduce((s, c) => s + c.close, 0) / Math.min(20, recent.length);
  const trendSignal: SignalType = sma5 > sma20 ? 'BULLISH' : sma5 < sma20 ? 'BEARISH' : 'NEUTRAL';
  const trendValue = ((sma5 - sma20) / sma20) * 100;
  components.push({ name: 'Trend', weight: 20, value: trendValue, signal: trendSignal });

  // 2. Volume Profile Signal (15%)
  const avgVolume = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const volumeRatio = latest.volume / avgVolume;
  const volSignal: SignalType = volumeRatio > 1.5 ? (latest.close > latest.open ? 'BULLISH' : 'BEARISH') : 'NEUTRAL';
  components.push({ name: 'Volume', weight: 15, value: volumeRatio, signal: volSignal });

  // 3. Delta Divergence (15%)
  const recentDelta = recent.slice(-5).reduce((s, c) => s + (c.delta || 0), 0);
  const priceChange = latest.close - recent[recent.length - 5]?.close;
  const deltaDivergence = (recentDelta > 0 && priceChange < 0) || (recentDelta < 0 && priceChange > 0);
  const deltaSignal: SignalType = deltaDivergence ? (recentDelta > 0 ? 'BULLISH' : 'BEARISH') : 'NEUTRAL';
  components.push({ name: 'Delta', weight: 15, value: Math.abs(recentDelta), signal: deltaSignal });

  // 4. EIA Signal (20%)
  const eiaSignal: SignalType = latest.eiaExpectation === 'draw' ? 'BULLISH' : 
                                 latest.eiaExpectation === 'build' ? 'BEARISH' : 'NEUTRAL';
  components.push({ name: 'EIA', weight: 20, value: latest.eiaExpectation === 'draw' ? 1 : latest.eiaExpectation === 'build' ? -1 : 0, signal: eiaSignal });

  // 5. Weather Impact (10%)
  const weatherSignal: SignalType = (latest.weatherImpact || 0) > 30 ? 'BULLISH' : 
                                     (latest.weatherImpact || 0) < -30 ? 'BEARISH' : 'NEUTRAL';
  components.push({ name: 'Weather', weight: 10, value: latest.weatherImpact || 0, signal: weatherSignal });

  // 6. Seasonal (10%)
  const seasonalSignal: SignalType = (latest.seasonalFactor || 1) > 1.1 ? 'BULLISH' : 
                                      (latest.seasonalFactor || 1) < 0.9 ? 'BEARISH' : 'NEUTRAL';
  components.push({ name: 'Seasonal', weight: 10, value: (latest.seasonalFactor || 1) - 1, signal: seasonalSignal });

  // 7. Momentum (10%)
  const momentum = latest.close - recent[0].close;
  const momentumSignal: SignalType = momentum > 0 ? 'BULLISH' : momentum < 0 ? 'BEARISH' : 'NEUTRAL';
  components.push({ name: 'Momentum', weight: 10, value: momentum, signal: momentumSignal });

  // Calculate weighted score
  let bullWeight = 0;
  let bearWeight = 0;
  let totalWeight = 0;
  
  components.forEach(comp => {
    totalWeight += comp.weight;
    if (comp.signal === 'BULLISH') bullWeight += comp.weight;
    else if (comp.signal === 'BEARISH') bearWeight += comp.weight;
  });

  const score = Math.round(50 + ((bullWeight - bearWeight) / totalWeight) * 50);
  const clampedScore = Math.max(0, Math.min(100, score));
  
  const signal: SignalType = clampedScore > 60 ? 'BULLISH' : clampedScore < 40 ? 'BEARISH' : 'NEUTRAL';
  const confidence = Math.abs(clampedScore - 50) * 2; // 0-100

  return { score: clampedScore, signal, confidence, components };
}
