'use client';

import { useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Brain, Droplets, Thermometer, Activity, Target, Gauge, ArrowUpRight, ArrowDownRight, Zap, Scale, Grid3x3 } from 'lucide-react';
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
                    <div className="grid grid-cols-2 gap-1.5">
                      <MetricCard label="Open" value={candle.open.toFixed(symbol === 'CL' ? 2 : 4)} />
                      <MetricCard label="High" value={candle.high.toFixed(symbol === 'CL' ? 2 : 4)} color="text-green-400" subtext={`H-L: ${(candle.high - candle.low).toFixed(symbol === 'CL' ? 2 : 4)}`} />
                      <MetricCard label="Low" value={candle.low.toFixed(symbol === 'CL' ? 2 : 4)} color="text-red-400" />
                      <MetricCard label="Close" value={candle.close.toFixed(symbol === 'CL' ? 2 : 4)} color={candle.close >= candle.open ? 'text-green-400' : 'text-red-400'} subtext={candle.close >= candle.open ? '▲ Bullish' : '▼ Bearish'} />
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

              {/* Bottom padding */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
