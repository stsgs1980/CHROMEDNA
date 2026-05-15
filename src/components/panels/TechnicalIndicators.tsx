'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Sigma } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';

function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  if (data.length === 0) return ema;
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

export function TechnicalIndicators() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const decDigits = symbol === 'CL' ? 2 : 4;

  const indicators = useMemo(() => {
    if (candles.length < 26) return null;

    const closes = candles.map((c) => c.close);

    // RSI (14-period)
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i <= rsiPeriod; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) avgGain += diff;
      else avgLoss += Math.abs(diff);
    }
    avgGain /= rsiPeriod;
    avgLoss /= rsiPeriod;
    for (let i = rsiPeriod + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      avgGain = (avgGain * (rsiPeriod - 1) + (diff > 0 ? diff : 0)) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + (diff < 0 ? Math.abs(diff) : 0)) / rsiPeriod;
    }
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    // MACD (12, 26, 9)
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    const macdLine: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }
    const signalLine = calcEMA(macdLine, 9);
    const macdValue = macdLine[macdLine.length - 1];
    const signalValue = signalLine[signalLine.length - 1];
    const histogramValue = macdValue - signalValue;

    const histogramBars: number[] = [];
    const barsCount = Math.min(12, macdLine.length);
    for (let i = macdLine.length - barsCount; i < macdLine.length; i++) {
      histogramBars.push(macdLine[i] - signalLine[i]);
    }

    // Bollinger Bands (20-period SMA, 2 stddev)
    const bbPeriod = 20;
    const recent = closes.slice(-bbPeriod);
    const middle = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, v) => sum + (v - middle) ** 2, 0) / recent.length;
    const stddev = Math.sqrt(variance);
    const upper = middle + 2 * stddev;
    const lower = middle - 2 * stddev;
    const currentPrice = closes[closes.length - 1];
    const percentB = upper === lower ? 0.5 : (currentPrice - lower) / (upper - lower);

    // ATR (14-period)
    const atrPeriod = 14;
    const trueRanges: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trueRanges.push(tr);
    }
    let atr = 0;
    if (trueRanges.length >= atrPeriod) {
      atr = trueRanges.slice(0, atrPeriod).reduce((a, b) => a + b, 0) / atrPeriod;
      for (let i = atrPeriod; i < trueRanges.length; i++) {
        atr = (atr * (atrPeriod - 1) + trueRanges[i]) / atrPeriod;
      }
    }

    const atrPct = (atr / currentPrice) * 100;
    const atrLevel: { label: string; color: string } =
      atrPct > 3 ? { label: 'Extreme', color: '#f87171' } :
      atrPct > 2 ? { label: 'High', color: '#fb923c' } :
      atrPct > 1 ? { label: 'Medium', color: '#fbbf24' } :
      { label: 'Low', color: '#4ade80' };

    return {
      rsi,
      macdValue,
      signalValue,
      histogramValue,
      histogramBars,
      upper,
      middle,
      lower,
      percentB,
      currentPrice,
      atr,
      atrLevel,
      atrPct,
    };
  }, [candles]);

  if (!indicators) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Technical Indicators</span>
        </div>
        <div className="text-xs text-gray-600 text-center py-4">Need at least 26 candles</div>
      </div>
    );
  }

  const rsiColor = indicators.rsi > 70 ? '#f87171' : indicators.rsi < 30 ? '#4ade80' : '#fbbf24';
  const rsiLabel = indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral';

  const maxHist = Math.max(...indicators.histogramBars.map(Math.abs), 0.0001);
  const histBarWidth = 16;
  const histChartH = 40;
  const histMidY = histChartH / 2;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Technical Indicators</span>
      </div>
      <div className="space-y-3">
        {/* RSI */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-medium">RSI (14)</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: rsiColor }}>
              {indicators.rsi.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <svg width="56" height="32" viewBox="0 0 56 32">
              <path d="M 4 28 A 24 24 0 0 1 52 28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
              <path d="M 4 28 A 24 24 0 0 1 12.5 7.3" fill="none" stroke="rgba(74,222,128,0.15)" strokeWidth="5" strokeLinecap="round" />
              <path d="M 43.5 7.3 A 24 24 0 0 1 52 28" fill="none" stroke="rgba(248,113,113,0.15)" strokeWidth="5" strokeLinecap="round" />
              {(() => {
                const angle = (indicators.rsi / 100) * Math.PI;
                const cx = 28, cy = 28, r = 24;
                const x2 = cx - r * Math.cos(angle);
                const y2 = cy - r * Math.sin(angle);
                return (
                  <path
                    d={`M 4 28 A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={rsiColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    filter="url(#rsi-glow)"
                  />
                );
              })()}
              <defs>
                <filter id="rsi-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
            </svg>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rsiColor }} />
                <span className="text-[10px] font-medium" style={{ color: rsiColor }}>{rsiLabel}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-green-400/60">30</span>
                <div className="flex-1 h-[3px] bg-white/[0.05] rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div className="h-full bg-green-500/10" style={{ width: '30%' }} />
                    <div className="h-full bg-amber-500/10" style={{ width: '40%' }} />
                    <div className="h-full bg-red-500/10" style={{ width: '30%' }} />
                  </div>
                  <motion.div
                    initial={{ left: '50%' }}
                    animate={{ left: `${indicators.rsi}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute top-0 w-1 h-full rounded-full"
                    style={{ backgroundColor: rsiColor }}
                  />
                </div>
                <span className="text-[8px] text-red-400/60">70</span>
              </div>
            </div>
          </div>
        </div>

        {/* MACD */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-medium">MACD (12, 26, 9)</span>
          </div>
          <svg width="100%" height={histChartH} viewBox={`0 0 ${indicators.histogramBars.length * histBarWidth} ${histChartH}`} className="w-full mb-2" preserveAspectRatio="none">
            <line x1="0" y1={histMidY} x2={indicators.histogramBars.length * histBarWidth} y2={histMidY} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            {indicators.histogramBars.map((val, i) => {
              const barH = (Math.abs(val) / maxHist) * (histChartH / 2 - 2);
              const isPositive = val >= 0;
              return (
                <rect
                  key={i}
                  x={i * histBarWidth + 2}
                  y={isPositive ? histMidY - barH : histMidY}
                  width={histBarWidth - 4}
                  height={Math.max(1, barH)}
                  fill={isPositive ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)'}
                  rx="1"
                />
              );
            })}
          </svg>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="data-label">MACD</span>
              <div className={`text-[10px] font-semibold tabular-nums ${indicators.macdValue >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {indicators.macdValue.toFixed(decDigits)}
              </div>
            </div>
            <div>
              <span className="data-label">Signal</span>
              <div className="text-[10px] font-semibold tabular-nums text-cyan-400">
                {indicators.signalValue.toFixed(decDigits)}
              </div>
            </div>
            <div>
              <span className="data-label">Hist</span>
              <div className={`text-[10px] font-semibold tabular-nums ${indicators.histogramValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {indicators.histogramValue.toFixed(decDigits)}
              </div>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-medium">Bollinger Bands (20, 2)</span>
            <span className={`text-[10px] font-bold tabular-nums ${
              indicators.percentB > 0.8 ? 'text-red-400' :
              indicators.percentB < 0.2 ? 'text-green-400' :
              'text-amber-400'
            }`}>
              %B {indicators.percentB.toFixed(2)}
            </span>
          </div>
          <div className="relative h-6 mb-2">
            <div className="absolute inset-x-0 top-2 h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-green-500/10" style={{ width: '20%' }} />
              <div className="absolute top-0 h-full bg-amber-500/5" style={{ left: '20%', width: '60%' }} />
              <div className="absolute right-0 top-0 h-full bg-red-500/10" style={{ width: '20%' }} />
              <div className="absolute top-0 h-full w-[1px] bg-white/10" style={{ left: '50%' }} />
              <motion.div
                initial={{ left: '50%' }}
                animate={{ left: `${Math.max(2, Math.min(98, indicators.percentB * 100))}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white/20"
                style={{
                  backgroundColor:
                    indicators.percentB > 0.8 ? '#f87171' :
                    indicators.percentB < 0.2 ? '#4ade80' :
                    '#fbbf24',
                }}
              />
            </div>
            <span className="absolute left-0 top-0 text-[7px] text-green-400/50">Lower</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-0 text-[7px] text-amber-400/50">Mid</span>
            <span className="absolute right-0 top-0 text-[7px] text-red-400/50">Upper</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="data-label">Upper</span>
              <div className="text-[10px] font-semibold tabular-nums text-red-400">{indicators.upper.toFixed(decDigits)}</div>
            </div>
            <div>
              <span className="data-label">Middle</span>
              <div className="text-[10px] font-semibold tabular-nums text-amber-400">{indicators.middle.toFixed(decDigits)}</div>
            </div>
            <div>
              <span className="data-label">Lower</span>
              <div className="text-[10px] font-semibold tabular-nums text-green-400">{indicators.lower.toFixed(decDigits)}</div>
            </div>
          </div>
        </div>

        {/* ATR */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sigma className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-gray-400 font-medium">ATR (14)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: indicators.atrLevel.color, boxShadow: `0 0 4px ${indicators.atrLevel.color}40` }}
              />
              <span className="text-[10px] font-bold" style={{ color: indicators.atrLevel.color }}>
                {indicators.atrLevel.label}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold tabular-nums text-white">
              {indicators.atr.toFixed(decDigits)}
            </span>
            <span className="text-[10px] text-gray-500 tabular-nums">
              {indicators.atrPct.toFixed(2)}% of price
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, indicators.atrPct * 25)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: indicators.atrLevel.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
