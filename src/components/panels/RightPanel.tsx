'use client';

import { useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Brain, Droplets, Thermometer, Activity, Target, Gauge, ArrowUpRight, ArrowDownRight, Zap, Scale, Grid3x3, Waves, Sigma, BarChart2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { ENERGY_SYMBOLS, EnergySymbol } from '@/types/energy';
import { SignalType } from '@/types/energy';

function SignalIcon({ signal }: { signal: SignalType }) {
  if (signal === 'BULLISH') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (signal === 'BEARISH') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

function SignalBadge({ signal }: { signal: SignalType }) {
  const colors = {
    BULLISH: 'border-green-500/50 text-green-400 bg-green-500/10',
    BEARISH: 'border-red-500/50 text-red-400 bg-red-500/10',
    NEUTRAL: 'border-gray-500/50 text-gray-400 bg-gray-500/10',
  };
  return (
    <Badge variant="outline" className={colors[signal]}>
      <SignalIcon signal={signal} />
      <span className="ml-1">{signal}</span>
    </Badge>
  );
}

function MetricCard({ label, value, color = 'text-white', subtext }: { label: string; value: string; color?: string; subtext?: string }) {
  return (
    <div className="metric-card-enhanced rounded-md px-2.5 py-1.5">
      <div className="data-label">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${color}`}>{value}</div>
      {subtext && <div className="text-[9px] text-gray-600 tabular-nums">{subtext}</div>}
    </div>
  );
}

function MiniCandleChart({ candles, width = 248, height = 80 }: { candles: { open: number; high: number; low: number; close: number }[]; width?: number; height?: number }) {
  if (candles.length < 2) return null;

  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const max = Math.max(...allHighs);
  const min = Math.min(...allLows);
  const range = max - min || 1;
  const padding = 4;
  const chartH = height - padding * 2;

  const yScale = (v: number) => chartH - ((v - min) / range) * chartH + padding;

  const candleWidth = Math.max(2, Math.floor((width - padding * 2) / candles.length) - 2);
  const gap = (width - padding * 2) / candles.length;

  const closeLine = candles.map((c, i) => {
    const x = padding + i * gap + gap / 2;
    return `${x},${yScale(c.close)}`;
  }).join(' ');

  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-2 animated-gradient-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="data-label">Price Chart (Last 20)</span>
        <span className="text-[9px] text-gray-600">{candles.length} candles</span>
      </div>
      <svg width={width} height={height} className="w-full">
        <defs>
          <linearGradient id="close-line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Close line area fill */}
        {candles.length > 1 && (() => {
          const firstX = padding + gap / 2;
          const lastX = padding + (candles.length - 1) * gap + gap / 2;
          const areaPath = `M ${firstX},${height} ${closeLine.split(' ').map(p => `L ${p}`).join(' ')} L ${lastX},${height} Z`;
          return <path d={areaPath} fill="url(#close-line-grad)" />;
        })()}
        {/* Candle bodies */}
        {candles.map((c, i) => {
          const x = padding + i * gap + gap / 2;
          const isUp = c.close >= c.open;
          const bodyTop = yScale(Math.max(c.open, c.close));
          const bodyBottom = yScale(Math.min(c.open, c.close));
          const wickTop = yScale(c.high);
          const wickBottom = yScale(c.low);
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);
          const color = isUp ? '#4ade80' : '#f87171';
          const colorFaded = isUp ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)';

          return (
            <g key={i}>
              {/* Wick */}
              <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={colorFaded} strokeWidth="1" />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx="0.5"
                opacity="0.7"
              />
            </g>
          );
        })}
        {/* Close line */}
        <polyline points={closeLine} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      </svg>
    </div>
  );
}

function OrderFlowSection() {
  const orderFlow = useMarketStore((s) => s.orderFlow);
  const symbol = useMarketStore((s) => s.symbol);

  if (!orderFlow) return null;

  const maxVol = Math.max(...orderFlow.levels.map((l) => Math.max(l.buyVolume, l.sellVolume)), 1);
  const decDigits = symbol === 'CL' ? 2 : 4;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Scale className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Flow</span>
      </div>

      {/* Cumulative Delta & Velocity */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Cum Delta"
          value={`${(orderFlow.cumulativeDelta / 1000).toFixed(1)}K`}
          color={orderFlow.cumulativeDelta >= 0 ? 'text-green-400' : 'text-red-400'}
          subtext={orderFlow.cumulativeDelta >= 0 ? 'Buying pressure' : 'Selling pressure'}
        />
        <MetricCard
          label="Velocity"
          value={`${orderFlow.velocity.toFixed(1)}`}
          color="text-amber-400"
          subtext="contracts/sec"
        />
      </div>

      {/* Large Trades */}
      {orderFlow.largeTrades.length > 0 && (
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-2.5">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Large Trades</div>
          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
            {orderFlow.largeTrades.slice(0, 8).map((trade, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 tabular-nums">{trade.price.toFixed(decDigits)}</span>
                <span className="tabular-nums text-gray-400">{trade.quantity.toLocaleString()}</span>
                <span className={`flex items-center gap-0.5 font-medium ${
                  trade.side === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.side === 'buy' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {trade.side.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footprint Levels */}
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-2.5">
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Footprint</div>
        <div className="space-y-[3px] max-h-28 overflow-y-auto custom-scrollbar">
          {orderFlow.levels.slice(0, 15).map((level, i) => {
            const buyWidth = (level.buyVolume / maxVol) * 100;
            const sellWidth = (level.sellVolume / maxVol) * 100;
            const hasImbalance = level.imbalance;
            return (
              <div key={i} className={`flex items-center gap-1.5 text-[9px] py-0.5 order-flow-level ${hasImbalance ? 'bg-white/[0.03] px-1' : ''}`}>
                <span className="text-gray-500 tabular-nums w-[52px] flex-shrink-0">{level.price.toFixed(decDigits)}</span>
                {/* Buy bar */}
                <div className="flex-1 flex items-center">
                  <div className="h-[6px] bg-green-500/40 rounded-l-sm" style={{ width: `${buyWidth}%` }} />
                  <div className="h-[6px] bg-red-500/40 rounded-r-sm" style={{ width: `${sellWidth}%`, marginLeft: '1px' }} />
                </div>
                {/* Delta */}
                <span className={`tabular-nums w-8 text-right flex-shrink-0 font-medium ${
                  level.delta >= 0 ? 'text-green-400/70' : 'text-red-400/70'
                }`}>
                  {(level.delta / 1000).toFixed(1)}K
                </span>
                {hasImbalance && (
                  <Zap className={`w-2.5 h-2.5 flex-shrink-0 ${level.imbalance === 'buy' ? 'text-green-400' : 'text-red-400'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Cross-Symbol Correlation Matrix
const SYMBOLS_ORDER: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];

function getCorrelationColor(value: number): { bg: string; text: string } {
  const magnitude = Math.abs(value);
  if (value >= 0) {
    // Green for positive correlation
    const opacity = 0.05 + magnitude * 0.25;
    return {
      bg: `rgba(74, 222, 128, ${opacity})`,
      text: magnitude > 0.5 ? 'text-green-400' : magnitude > 0.2 ? 'text-green-400/70' : 'text-gray-400',
    };
  } else {
    // Red for negative correlation
    const opacity = 0.05 + magnitude * 0.25;
    return {
      bg: `rgba(248, 113, 113, ${opacity})`,
      text: magnitude > 0.5 ? 'text-red-400' : magnitude > 0.2 ? 'text-red-400/70' : 'text-gray-400',
    };
  }
}

function CorrelationMatrix() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  // Generate mock correlation matrix based on energy market relationships
  const correlationData = useMemo(() => {
    // Base correlation structure for energy markets (realistic relationships)
    // CL-RB: high positive (gasoline derived from crude)
    // CL-HO: high positive (heating oil from crude)
    // NG-CL: moderate positive (substitute effect)
    // RB-HO: very high positive (both refined products)
    const baseCorrelations: Record<string, number> = {
      'CL-CL': 1.0, 'CL-NG': 0.42, 'CL-RB': 0.87, 'CL-HO': 0.83,
      'NG-CL': 0.42, 'NG-NG': 1.0, 'NG-RB': 0.35, 'NG-HO': 0.51,
      'RB-CL': 0.87, 'RB-NG': 0.35, 'RB-RB': 1.0, 'RB-HO': 0.92,
      'HO-CL': 0.83, 'HO-NG': 0.51, 'HO-RB': 0.92, 'HO-HO': 1.0,
    };

    // Add small random variation based on candle data to make it dynamic
    const seed = candles.length > 0 ? candles[candles.length - 1].time % 1000 : 0;
    const variation = (seed / 1000) * 0.08 - 0.04; // ±0.04

    return SYMBOLS_ORDER.map((row) =>
      SYMBOLS_ORDER.map((col) => {
        const key = `${row}-${col}`;
        const base = baseCorrelations[key] ?? 0;
        // Diagonal is always 1.0
        if (row === col) return { value: 1.0, row, col };
        // Add small variation
        const varied = Math.max(-1, Math.min(1, base + variation));
        return { value: parseFloat(varied.toFixed(2)), row, col };
      })
    );
  }, [candles]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Grid3x3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Correlation Matrix</span>
        <span className="text-[9px] text-gray-600 ml-auto">4 symbols</span>
      </div>
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
        {/* Column headers */}
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `28px repeat(4, 1fr)` }}>
          <div /> {/* Empty top-left corner */}
          {SYMBOLS_ORDER.map((s) => (
            <div
              key={`h-${s}`}
              className={`text-[9px] font-bold text-center py-1 ${
                s === symbol ? 'text-amber-400' : 'text-gray-500'
              }`}
            >
              {s}
            </div>
          ))}

          {/* Matrix rows */}
          {correlationData.map((row, rowIdx) => (
            <Fragment key={`row-${SYMBOLS_ORDER[rowIdx]}`}>
              {/* Row label */}
              <div
                key={`r-${SYMBOLS_ORDER[rowIdx]}`}
                className={`text-[9px] font-bold flex items-center justify-end pr-1 ${
                  SYMBOLS_ORDER[rowIdx] === symbol ? 'text-amber-400' : 'text-gray-500'
                }`}
              >
                {SYMBOLS_ORDER[rowIdx]}
              </div>

              {/* Row cells */}
              {row.map((cell, colIdx) => {
                const colors = getCorrelationColor(cell.value);
                const isDiagonal = rowIdx === colIdx;
                const isActive = SYMBOLS_ORDER[rowIdx] === symbol || SYMBOLS_ORDER[colIdx] === symbol;

                return (
                  <div
                    key={`c-${SYMBOLS_ORDER[rowIdx]}-${SYMBOLS_ORDER[colIdx]}`}
                    className={`rounded-sm flex items-center justify-center py-1.5 text-[9px] font-semibold tabular-nums transition-all duration-300 ${
                      isDiagonal ? 'ring-1 ring-inset ring-white/10' : ''
                    } ${isActive ? 'ring-1 ring-inset ring-amber-500/15' : ''}`}
                    style={{ backgroundColor: colors.bg }}
                    title={`${SYMBOLS_ORDER[rowIdx]}/${SYMBOLS_ORDER[colIdx]}: ${cell.value.toFixed(2)}`}
                  >
                    <span className={isDiagonal ? 'text-white/40' : colors.text}>
                      {cell.value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'rgba(248,113,113,0.2)' }} />
              <span className="text-[8px] text-gray-600">Neg</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-white/[0.05]" />
              <span className="text-[8px] text-gray-600">0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'rgba(74,222,128,0.2)' }} />
              <span className="text-[8px] text-gray-600">Pos</span>
            </div>
          </div>
          <span className="text-[8px] text-gray-600">30D rolling</span>
        </div>
      </div>
    </div>
  );
}

// Market Regime Indicator - detects trending, ranging, or volatile market conditions
type RegimeType = 'TRENDING' | 'RANGING' | 'VOLATILE' | 'QUIET';

function MarketRegimeIndicator() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const regime = useMemo<{ type: RegimeType; strength: number; label: string; color: string; description: string }>(() => {
    if (candles.length < 20) return { type: 'QUIET', strength: 0, label: 'Insufficient Data', color: '#6b7280', description: 'Not enough data' };

    const recent = candles.slice(-20);
    const closes = recent.map(c => c.close);

    // Calculate ADX-like trend strength
    let plusDM = 0;
    let minusDM = 0;
    for (let i = 1; i < recent.length; i++) {
      const highDiff = recent[i].high - recent[i - 1].high;
      const lowDiff = recent[i - 1].low - recent[i].low;
      plusDM += highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
      minusDM += lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;
    }
    const trendStrength = Math.abs(plusDM - minusDM) / (plusDM + minusDM || 1);

    // Calculate price range relative to ATR
    const priceRange = Math.max(...closes) - Math.min(...closes);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const normalizedRange = priceRange / avgPrice;

    // Calculate volatility (standard deviation of returns)
    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Determine regime
    if (volatility > 0.02 && normalizedRange > 0.05) {
      return {
        type: 'VOLATILE',
        strength: Math.min(100, Math.round(volatility * 3000)),
        label: 'Volatile',
        color: '#f87171',
        description: 'High volatility with large price swings. Caution advised.',
      };
    } else if (trendStrength > 0.3 && normalizedRange > 0.02) {
      return {
        type: 'TRENDING',
        strength: Math.min(100, Math.round(trendStrength * 200)),
        label: 'Trending',
        color: plusDM > minusDM ? '#4ade80' : '#f87171',
        description: plusDM > minusDM ? 'Uptrend detected. Momentum is bullish.' : 'Downtrend detected. Momentum is bearish.',
      };
    } else if (normalizedRange < 0.015) {
      return {
        type: 'QUIET',
        strength: Math.min(100, Math.round((1 - normalizedRange * 50) * 100)),
        label: 'Quiet',
        color: '#6b7280',
        description: 'Low activity. Consolidation phase.',
      };
    } else {
      return {
        type: 'RANGING',
        strength: Math.min(100, Math.round((1 - trendStrength) * 100)),
        label: 'Ranging',
        color: '#fbbf24',
        description: 'Price oscillating within a range. Look for breakout.',
      };
    }
  }, [candles, symbol]);

  const recent = candles.slice(-20);

  // Calculate 20-period stats
  const stats = useMemo(() => {
    if (recent.length < 2) return null;
    const avgVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
    const avgDelta = recent.reduce((s, c) => s + (c.delta || 0), 0) / recent.length;
    return { avgVol: Math.round(avgVol), avgDelta: Math.round(avgDelta) };
  }, [recent]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Waves className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Market Regime</span>
      </div>
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
        {/* Regime badge */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: regime.color, boxShadow: `0 0 6px ${regime.color}40` }}
            />
            <span className="text-xs font-bold" style={{ color: regime.color }}>
              {regime.label}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 tabular-nums">{regime.strength}%</span>
        </div>

        {/* Strength bar */}
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${regime.strength}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: regime.color }}
          />
        </div>

        {/* Description */}
        <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{regime.description}</p>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04]">
            <div>
              <span className="data-label">Avg Volume</span>
              <div className="text-[10px] font-semibold text-gray-300 tabular-nums">{(stats.avgVol / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <span className="data-label">Avg Delta</span>
              <div className={`text-[10px] font-semibold tabular-nums ${stats.avgDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(stats.avgDelta / 1000).toFixed(1)}K
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Technical Indicators Section ───────────────────────────────────────────

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

function TechnicalIndicators() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const decDigits = symbol === 'CL' ? 2 : 4;

  const indicators = useMemo(() => {
    if (candles.length < 26) return null;

    const closes = candles.map((c) => c.close);

    // ── RSI (14-period) ──
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

    // ── MACD (12, 26, 9) ──
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

    // Last 12 histogram bars for mini chart
    const histogramBars: number[] = [];
    const barsCount = Math.min(12, macdLine.length);
    for (let i = macdLine.length - barsCount; i < macdLine.length; i++) {
      histogramBars.push(macdLine[i] - signalLine[i]);
    }

    // ── Bollinger Bands (20-period SMA, 2 stddev) ──
    const bbPeriod = 20;
    const recent = closes.slice(-bbPeriod);
    const middle = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, v) => sum + (v - middle) ** 2, 0) / recent.length;
    const stddev = Math.sqrt(variance);
    const upper = middle + 2 * stddev;
    const lower = middle - 2 * stddev;
    const currentPrice = closes[closes.length - 1];
    const percentB = upper === lower ? 0.5 : (currentPrice - lower) / (upper - lower);

    // ── ATR (14-period) ──
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

    // ATR volatility level
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

  // MACD histogram bar heights for SVG
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
        {/* ── RSI ── */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-medium">RSI (14)</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: rsiColor }}>
              {indicators.rsi.toFixed(1)}
            </span>
          </div>
          {/* Mini gauge arc */}
          <div className="flex items-center gap-3">
            <svg width="56" height="32" viewBox="0 0 56 32">
              {/* Background arc */}
              <path d="M 4 28 A 24 24 0 0 1 52 28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
              {/* Zone overlays */}
              <path d="M 4 28 A 24 24 0 0 1 12.5 7.3" fill="none" stroke="rgba(74,222,128,0.15)" strokeWidth="5" strokeLinecap="round" />
              <path d="M 43.5 7.3 A 24 24 0 0 1 52 28" fill="none" stroke="rgba(248,113,113,0.15)" strokeWidth="5" strokeLinecap="round" />
              {/* Value arc */}
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
                  {/* Zone backgrounds */}
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

        {/* ── MACD ── */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-medium">MACD (12, 26, 9)</span>
          </div>
          {/* Mini histogram chart */}
          <svg width="100%" height={histChartH} viewBox={`0 0 ${indicators.histogramBars.length * histBarWidth} ${histChartH}`} className="w-full mb-2" preserveAspectRatio="none">
            {/* Zero line */}
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
          {/* MACD values */}
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

        {/* ── Bollinger Bands ── */}
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
          {/* Visual position bar */}
          <div className="relative h-6 mb-2">
            {/* Band range bar */}
            <div className="absolute inset-x-0 top-2 h-2 bg-white/[0.04] rounded-full overflow-hidden">
              {/* Lower zone (0-0.2) */}
              <div className="absolute left-0 top-0 h-full bg-green-500/10" style={{ width: '20%' }} />
              {/* Middle zone (0.2-0.8) */}
              <div className="absolute top-0 h-full bg-amber-500/5" style={{ left: '20%', width: '60%' }} />
              {/* Upper zone (0.8-1.0) */}
              <div className="absolute right-0 top-0 h-full bg-red-500/10" style={{ width: '20%' }} />
              {/* Center line */}
              <div className="absolute top-0 h-full w-[1px] bg-white/10" style={{ left: '50%' }} />
              {/* Position dot */}
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
            {/* Labels */}
            <span className="absolute left-0 top-0 text-[7px] text-green-400/50">Lower</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-0 text-[7px] text-amber-400/50">Mid</span>
            <span className="absolute right-0 top-0 text-[7px] text-red-400/50">Upper</span>
          </div>
          {/* Band values */}
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

        {/* ── ATR ── */}
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
          {/* Volatility bar */}
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

export function RightPanel() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const symbol = useMarketStore((s) => s.symbol);
  const candles = useMarketStore((s) => s.candles);
  const selectedCandleIndex = useMarketStore((s) => s.selectedCandleIndex);
  const aiScore = useMarketStore((s) => s.aiScore);
  const info = ENERGY_SYMBOLS[symbol];

  const candle = selectedCandleIndex !== null ? candles[selectedCandleIndex] : candles[candles.length - 1];
  const last20Candles = useMemo(() => candles.slice(-20), [candles]);

  // For the score gauge arc
  const scoreArc = useMemo(() => {
    if (!aiScore) return null;
    const angle = (aiScore.score / 100) * 270;
    const rad = 28;
    const cx = 36;
    const cy = 36;
    const startAngle = 135;
    const endAngle = startAngle + angle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + rad * Math.cos(startRad);
    const y1 = cy + rad * Math.sin(startRad);
    const x2 = cx + rad * Math.cos(endRad);
    const y2 = cy + rad * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    return {
      path: `M ${x1} ${y1} A ${rad} ${rad} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: aiScore.score >= 65 ? '#4ade80' : aiScore.score >= 40 ? '#fbbf24' : '#f87171',
    };
  }, [aiScore]);

  return (
    <AnimatePresence>
      {rightPanelOpen && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-14 bottom-0 w-[300px] z-40 glass-panel panel-edge-right panel-responsive-right overflow-hidden"
        >
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Candle Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {selectedCandleIndex !== null ? `Candle #${selectedCandleIndex + 1}` : 'Latest Candle'}
                  </span>
                  <span className="text-[9px] text-gray-600 ml-auto">{symbol} · {info.unit}</span>
                </div>
                {candle ? (
                  <div className="space-y-2">
                    {/* Direction bar */}
                    <div className={`h-1 rounded-full ${
                      candle.close >= candle.open
                        ? 'bg-gradient-to-r from-green-500/60 via-green-400/80 to-green-500/60'
                        : 'bg-gradient-to-r from-red-500/60 via-red-400/80 to-red-500/60'
                    }`} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <MetricCard label="Open" value={candle.open.toFixed(symbol === 'CL' ? 2 : 4)} />
                      <MetricCard label="High" value={candle.high.toFixed(symbol === 'CL' ? 2 : 4)} color="text-green-400" />
                      <MetricCard label="Low" value={candle.low.toFixed(symbol === 'CL' ? 2 : 4)} color="text-red-400" />
                      <MetricCard label="Close" value={candle.close.toFixed(symbol === 'CL' ? 2 : 4)} color={candle.close >= candle.open ? 'text-green-400' : 'text-red-400'} subtext={candle.close >= candle.open ? '▲ Bullish' : '▼ Bearish'} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <MetricCard
                        label="Change"
                        value={`${candle.close >= candle.open ? '+' : ''}${(candle.close - candle.open).toFixed(symbol === 'CL' ? 2 : 4)}`}
                        color={candle.close >= candle.open ? 'text-green-400' : 'text-red-400'}
                        subtext={`${(((candle.close - candle.open) / candle.open) * 100).toFixed(2)}%`}
                      />
                      <MetricCard
                        label="Range"
                        value={`${(candle.high - candle.low).toFixed(symbol === 'CL' ? 2 : 4)}`}
                        color="text-amber-400"
                        subtext="H − L"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <MetricCard label="Volume" value={`${(candle.volume / 1000).toFixed(0)}K`} />
                      <MetricCard label="OI" value={`${(candle.openInterest / 1000).toFixed(0)}K`} />
                      <MetricCard label="Delta" value={`${((candle.delta || 0) / 1000).toFixed(1)}K`} color={(candle.delta || 0) >= 0 ? 'text-green-400' : 'text-red-400'} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <MetricCard label="Buy Vol" value={`${((candle.buyVolume || 0) / 1000).toFixed(0)}K`} color="text-emerald-400" />
                      <MetricCard label="Sell Vol" value={`${((candle.sellVolume || 0) / 1000).toFixed(0)}K`} color="text-rose-400" />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 text-center py-4">No data available</div>
                )}
              </div>

              {/* Mini Candle Chart */}
              <MiniCandleChart candles={last20Candles} />

              <div className="section-divider-enhanced" />

              {/* AI Score with Gauge */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Composite</span>
                </div>
                {aiScore && scoreArc ? (
                  <div className="space-y-3">
                    {/* Score Gauge */}
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0 ai-gauge-glow">
                        <svg width="72" height="72" viewBox="0 0 72 72">
                          {/* Background arc */}
                          <circle
                            cx="36" cy="36" r="28"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="5"
                            strokeDasharray="132 176"
                            strokeDashoffset="-44"
                            strokeLinecap="round"
                          />
                          {/* Score arc with glow filter */}
                          <defs>
                            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="2" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <path
                            d={scoreArc.path}
                            fill="none"
                            stroke={scoreArc.color}
                            strokeWidth="5"
                            strokeLinecap="round"
                            filter="url(#gauge-glow)"
                          />
                          {/* Score text */}
                          <text x="36" y="34" textAnchor="middle" className="text-lg font-bold" fill="white" fontSize="16" fontFamily="monospace">
                            {aiScore.score}
                          </text>
                          <text x="36" y="46" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">
                            / 100
                          </text>
                        </svg>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <SignalBadge signal={aiScore.signal} />
                        <div>
                          <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                            <span>Confidence</span>
                            <span className="text-gray-400">{aiScore.confidence}%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${aiScore.confidence}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 confidence-bar-fill"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Components with color bars */}
                    <div className="space-y-2">
                      {aiScore.components.map((comp) => {
                        const barColor = comp.signal === 'BULLISH'
                          ? 'from-green-500 to-green-400'
                          : comp.signal === 'BEARISH'
                          ? 'from-red-500 to-red-400'
                          : 'from-gray-500 to-gray-400';
                        const barBg = comp.signal === 'BULLISH'
                          ? 'bg-green-500/10'
                          : comp.signal === 'BEARISH'
                          ? 'bg-red-500/10'
                          : 'bg-gray-500/10';

                        return (
                          <div key={comp.name} className={`${barBg} rounded-md px-2.5 py-1.5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-300 font-medium">{comp.name}</span>
                              <div className="flex items-center gap-1.5">
                                <SignalIcon signal={comp.signal} />
                                <span className="text-[9px] text-gray-500 tabular-nums">{comp.weight}%</span>
                              </div>
                            </div>
                            {/* Color bar */}
                            <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                                style={{ width: `${comp.value}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <span className="text-[8px] text-gray-600">0</span>
                              <span className="text-[8px] text-gray-500 tabular-nums font-medium">{comp.value}</span>
                              <span className="text-[8px] text-gray-600">100</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-600">
                    <Activity className="w-3.5 h-3.5 mr-2 animate-pulse" />
                    Calculating AI score...
                  </div>
                )}
              </div>

              <div className="section-divider-enhanced" />

              {/* Technical Indicators */}
              <TechnicalIndicators />

              <div className="section-divider-enhanced" />

              {/* Order Flow Section */}
              <OrderFlowSection />

              <div className="section-divider-enhanced" />

              {/* Energy Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Energy Metrics</span>
                </div>
                {candle ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-white/[0.03] border border-white/[0.03] energy-metric-item">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[11px] text-gray-400">EIA Report</span>
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${
                        candle.eiaExpectation === 'draw' ? 'text-green-400' :
                        candle.eiaExpectation === 'build' ? 'text-red-400' :
                        'text-gray-500'
                      }`}>
                        {candle.eiaExpectation === 'draw' ? '↓ Draw' :
                         candle.eiaExpectation === 'build' ? '↑ Build' :
                         candle.eiaExpectation?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-white/[0.03] border border-white/[0.03] energy-metric-item">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[11px] text-gray-400">Weather Impact</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Mini bar for weather */}
                        <div className="w-16 h-[4px] bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${Math.abs(candle.weatherImpact || 0) > 50 ? 'bg-orange-400' : 'bg-gray-500/50'}`}
                            style={{ width: `${Math.min(100, Math.abs(candle.weatherImpact || 0))}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-semibold tabular-nums ${
                          Math.abs(candle.weatherImpact || 0) > 50 ? 'text-orange-400' : 'text-gray-400'
                        }`}>
                          {candle.weatherImpact?.toFixed(0) || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-white/[0.03] border border-white/[0.03] energy-metric-item">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] text-gray-400">Seasonal Factor</span>
                      </div>
                      <span className={`text-[11px] font-semibold tabular-nums ${
                        (candle.seasonalFactor || 1) > 1.1 ? 'text-green-400' :
                        (candle.seasonalFactor || 1) < 0.9 ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {((candle.seasonalFactor || 1) * 100).toFixed(0)}%
                        {(candle.seasonalFactor || 1) > 1 ? ' ↑' : (candle.seasonalFactor || 1) < 1 ? ' ↓' : ''}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="section-divider-enhanced" />

              {/* Cross-Symbol Correlation Matrix */}
              <CorrelationMatrix />

              <div className="section-divider-enhanced" />

              {/* Market Regime Indicator */}
              <MarketRegimeIndicator />

              {/* Bottom padding */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
