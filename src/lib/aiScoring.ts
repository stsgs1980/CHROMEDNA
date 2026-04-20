import { EnergyCandle, AICompositeScore, ScoreComponent } from '@/types/market';
import { SignalType } from '@/types/energy';

function computeSignal(value: number, thresholds: [number, number] = [40, 60]): SignalType {
  if (value >= thresholds[1]) return 'BULLISH';
  if (value <= thresholds[0]) return 'BEARISH';
  return 'NEUTRAL';
}

// Trend Score: based on moving average alignment and price position
function computeTrendScore(candles: EnergyCandle[]): ScoreComponent {
  if (candles.length < 20) {
    return { name: 'Trend', weight: 20, value: 50, signal: 'NEUTRAL' };
  }

  const closes = candles.map(c => c.close);
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const current = closes[closes.length - 1];

  // Bullish: price > SMA10 > SMA20, all aligned upward
  let score = 50;
  
  // Price relative to SMAs
  if (current > sma10) score += 10;
  if (current > sma20) score += 10;
  if (sma10 > sma20) score += 10;
  if (sma5 > sma10) score += 5;
  
  // Price below SMAs
  if (current < sma10) score -= 10;
  if (current < sma20) score -= 10;
  if (sma10 < sma20) score -= 10;
  if (sma5 < sma10) score -= 5;

  // Recent momentum
  const recentChange = (current - closes[closes.length - 5]) / closes[closes.length - 5];
  score += Math.max(-15, Math.min(15, recentChange * 1000));

  return {
    name: 'Trend',
    weight: 20,
    value: Math.max(0, Math.min(100, Math.round(score))),
    signal: computeSignal(score),
  };
}

// Volume Score: compares recent volume to average
function computeVolumeScore(candles: EnergyCandle[]): ScoreComponent {
  if (candles.length < 10) {
    return { name: 'Volume', weight: 15, value: 50, signal: 'NEUTRAL' };
  }

  const volumes = candles.map(c => c.volume);
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
  const recentVol = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const volRatio = recentVol / avgVol;

  // High volume on up moves = bullish, high volume on down moves = bearish
  const recentCandles = candles.slice(-3);
  const isUp = recentCandles.filter(c => c.close > c.open).length > recentCandles.filter(c => c.close < c.open).length;

  let score = 50;
  if (volRatio > 1.5) score += isUp ? 25 : -25;
  else if (volRatio > 1.2) score += isUp ? 15 : -15;
  else if (volRatio < 0.7) score -= 5;

  return {
    name: 'Volume',
    weight: 15,
    value: Math.max(0, Math.min(100, Math.round(score))),
    signal: computeSignal(score),
  };
}

// Delta Score: buy vs sell pressure
function computeDeltaScore(candles: EnergyCandle[]): ScoreComponent {
  if (candles.length < 5) {
    return { name: 'Delta', weight: 15, value: 50, signal: 'NEUTRAL' };
  }

  const recentCandles = candles.slice(-10);
  const totalDelta = recentCandles.reduce((sum, c) => sum + (c.delta || 0), 0);
  const totalVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0);
  const deltaRatio = totalVolume > 0 ? totalDelta / totalVolume : 0;

  let score = 50 + deltaRatio * 300;
  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Delta',
    weight: 15,
    value: Math.round(score),
    signal: computeSignal(score),
  };
}

// EIA Score: based on EIA report expectations
function computeEIAScore(candles: EnergyCandle[]): ScoreComponent {
  const eiaCandles = candles.filter(c => c.eiaExpectation);
  
  if (eiaCandles.length === 0) {
    return { name: 'EIA', weight: 15, value: 50, signal: 'NEUTRAL' };
  }

  const latestEIA = eiaCandles[eiaCandles.length - 1];
  let score = 50;

  if (latestEIA.eiaExpectation === 'draw') score = 72;
  else if (latestEIA.eiaExpectation === 'build') score = 28;
  else score = 50;

  // If the candle closed up on EIA day, boost the signal
  if (latestEIA.close > latestEIA.open) score += 8;
  else score -= 8;

  return {
    name: 'EIA',
    weight: 15,
    value: Math.max(0, Math.min(100, Math.round(score))),
    signal: computeSignal(score),
  };
}

// Weather Score
function computeWeatherScore(candles: EnergyCandle[]): ScoreComponent {
  const recentCandles = candles.slice(-5);
  const avgWeather = recentCandles.reduce((sum, c) => sum + (c.weatherImpact || 0), 0) / recentCandles.length;

  let score = 50 + avgWeather * 0.5;
  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Weather',
    weight: 10,
    value: Math.round(score),
    signal: computeSignal(score, [35, 65]),
  };
}

// Seasonal Score
function computeSeasonalScore(candles: EnergyCandle[]): ScoreComponent {
  const recentCandles = candles.slice(-5);
  const avgSeasonal = recentCandles.reduce((sum, c) => sum + (c.seasonalFactor || 1), 0) / recentCandles.length;

  let score = 50 + (avgSeasonal - 1) * 150;
  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Seasonal',
    weight: 10,
    value: Math.round(score),
    signal: computeSignal(score, [35, 65]),
  };
}

// Momentum Score: rate of change
function computeMomentumScore(candles: EnergyCandle[]): ScoreComponent {
  if (candles.length < 10) {
    return { name: 'Momentum', weight: 15, value: 50, signal: 'NEUTRAL' };
  }

  const closes = candles.map(c => c.close);
  const roc5 = (closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6];
  const roc10 = (closes[closes.length - 1] - closes[closes.length - 11]) / closes[closes.length - 11];

  let score = 50 + (roc5 * 800 + roc10 * 400);
  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Momentum',
    weight: 15,
    value: Math.round(score),
    signal: computeSignal(score),
  };
}

export function calculateCompositeScore(candles: EnergyCandle[]): AICompositeScore {
  if (candles.length < 5) {
    return {
      score: 50,
      signal: 'NEUTRAL',
      confidence: 20,
      components: [
        { name: 'Trend', weight: 20, value: 50, signal: 'NEUTRAL' },
        { name: 'Volume', weight: 15, value: 50, signal: 'NEUTRAL' },
        { name: 'Delta', weight: 15, value: 50, signal: 'NEUTRAL' },
        { name: 'EIA', weight: 15, value: 50, signal: 'NEUTRAL' },
        { name: 'Weather', weight: 10, value: 50, signal: 'NEUTRAL' },
        { name: 'Seasonal', weight: 10, value: 50, signal: 'NEUTRAL' },
        { name: 'Momentum', weight: 15, value: 50, signal: 'NEUTRAL' },
      ],
    };
  }

  const components: ScoreComponent[] = [
    computeTrendScore(candles),
    computeVolumeScore(candles),
    computeDeltaScore(candles),
    computeEIAScore(candles),
    computeWeatherScore(candles),
    computeSeasonalScore(candles),
    computeMomentumScore(candles),
  ];

  // Weighted average
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight;
  const score = Math.round(weightedScore);

  // Confidence: how aligned are the components?
  const bullishCount = components.filter(c => c.signal === 'BULLISH').length;
  const bearishCount = components.filter(c => c.signal === 'BEARISH').length;
  const maxAgreement = Math.max(bullishCount, bearishCount);
  const confidence = Math.round((maxAgreement / components.length) * 100);

  const signal: SignalType = score >= 58 ? 'BULLISH' : score <= 42 ? 'BEARISH' : 'NEUTRAL';

  return { score, signal, confidence, components };
}
