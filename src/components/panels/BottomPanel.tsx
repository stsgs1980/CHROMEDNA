'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Layers, Target } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { ENERGY_SYMBOLS } from '@/types/energy';

export function BottomPanel() {
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const volumeProfile = useMarketStore((s) => s.volumeProfile);
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'volume' | 'delta' | 'both'>('both');

  // Compute derived data with useMemo before any early returns
  const levels = volumeProfile?.levels ?? [];
  const maxVolume = levels.length > 0 ? Math.max(...levels.map((l) => l.volume)) : 1;
  const maxAbsDelta = levels.length > 0 ? Math.max(...levels.map((l) => Math.abs(l.delta)), 1) : 1;
  const decDigits = symbol === 'CL' ? 2 : 4;

  const allPrices = levels.map((l) => l.price);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
  const priceRange = maxPrice - minPrice || 1;

  const priceOverlay = useMemo(() => {
    const lastCandles = candles.slice(-50);
    if (lastCandles.length < 2 || levels.length === 0) return null;

    const points = lastCandles.map((c, i) => {
      const x = (i / (lastCandles.length - 1)) * 100;
      const y = ((maxPrice - c.close) / priceRange) * 100;
      return { x, y, close: c.close };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPath = `M 0,100 ${points.map((p) => `L ${p.x},${p.y}`).join(' ')} L 100,100 Z`;

    return { polyline, areaPath, points };
  }, [candles, levels.length, maxPrice, priceRange]);

  const vahPct = volumeProfile ? ((maxPrice - volumeProfile.vah) / priceRange) * 100 : 0;
  const valPct = volumeProfile ? ((maxPrice - volumeProfile.val) / priceRange) * 100 : 0;

  const deltaDistribution = useMemo(() => {
    if (levels.length === 0) return [];
    const bins = 12;
    const deltas = levels.map((l) => l.delta);
    const maxDelta = Math.max(...deltas.map(Math.abs), 1);
    const binSize = (maxDelta * 2) / bins;

    const histogram = Array.from({ length: bins }, (_, i) => ({
      range: `${((-maxDelta + i * binSize) / 1000).toFixed(1)}K`,
      count: 0,
      isPositive: -maxDelta + i * binSize + binSize / 2 >= 0,
    }));

    deltas.forEach((d) => {
      const binIndex = Math.min(bins - 1, Math.max(0, Math.floor((d + maxDelta) / binSize)));
      histogram[binIndex].count++;
    });

    return histogram;
  }, [levels]);

  const maxBinCount = deltaDistribution.length > 0 ? Math.max(...deltaDistribution.map((b) => b.count), 1) : 1;

  if (!volumeProfile || volumeProfile.levels.length === 0) return null;

  return (
    <AnimatePresence>
      {bottomPanelOpen && (
        <motion.div
          initial={{ y: 220, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 220, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-40 glass-panel panel-edge-bottom"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Volume Profile</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-gray-500">POC</span>
                  <span className="text-amber-400 font-semibold tabular-nums">{volumeProfile.poc.toFixed(decDigits)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">VAH</span>
                  <span className="text-green-400/70 font-semibold tabular-nums">{volumeProfile.vah.toFixed(decDigits)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">VAL</span>
                  <span className="text-red-400/70 font-semibold tabular-nums">{volumeProfile.val.toFixed(decDigits)}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center bg-white/[0.04] rounded-md p-0.5 border border-white/[0.03]">
                {(['volume', 'delta', 'both'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                      viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleBottomPanel}
                className="text-gray-500 hover:text-gray-300 p-1 hover:bg-white/5 rounded transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="h-[200px] flex">
            {/* Volume Profile Chart */}
            <div className="flex-1 relative px-4 py-2">
              {/* Value area background */}
              <div
                className="absolute left-0 right-0 bg-amber-500/[0.03] pointer-events-none"
                style={{
                  top: `${vahPct}%`,
                  height: `${valPct - vahPct}%`,
                }}
              />

              {/* POC line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-amber-500/30 pointer-events-none"
                style={{ top: `${((maxPrice - volumeProfile.poc) / priceRange) * 100}%` }}
              >
                <span className="absolute left-2 -top-3 text-[8px] text-amber-400/60 font-semibold">POC</span>
              </div>

              {/* Bars + Price overlay */}
              <div className="h-full relative flex items-stretch gap-[2px]">
                {/* Volume / Delta bars */}
                <div className="flex-1 flex items-stretch gap-[1px] relative">
                  {volumeProfile.levels.map((level, i) => {
                    const volPct = maxVolume > 0 ? (level.volume / maxVolume) * 100 : 0;
                    const deltaPct = (level.delta / maxAbsDelta) * 50;
                    const isPOC = Math.abs(level.price - volumeProfile.poc) < (volumeProfile.vah - volumeProfile.val) * 0.05;
                    const isVA = level.price >= volumeProfile.val && level.price <= volumeProfile.vah;
                    const isHovered = hoveredIndex === i;

                    return (
                      <div
                        key={i}
                        className="flex-1 min-w-[2px] flex flex-col justify-end relative group cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Volume bar */}
                        {(viewMode === 'volume' || viewMode === 'both') && (
                          <div
                            className={`w-full rounded-t-sm transition-all duration-150 ${
                              isHovered ? 'opacity-100' : 'opacity-80'
                            } ${
                              isPOC
                                ? 'bg-amber-400/80 shadow-sm shadow-amber-400/20'
                                : isVA
                                ? level.delta >= 0 ? 'bg-green-500/40' : 'bg-red-500/40'
                                : level.delta >= 0 ? 'bg-green-500/15' : 'bg-red-500/15'
                            }`}
                            style={{ height: `${volPct}%` }}
                          />
                        )}

                        {/* Delta bar (centered) */}
                        {(viewMode === 'delta' || viewMode === 'both') && viewMode !== 'volume' && (
                          <div
                            className="absolute bottom-[50%] w-full"
                            style={{
                              height: `${Math.abs(deltaPct)}%`,
                            }}
                          >
                            <div
                              className={`w-full rounded-t-sm transition-all duration-150 ${
                                level.delta >= 0 ? 'bg-green-400/50' : 'bg-red-400/50'
                              } ${isHovered ? 'opacity-100' : 'opacity-60'}`}
                              style={{
                                height: '100%',
                                marginTop: level.delta >= 0 ? '0' : 'auto',
                              }}
                            />
                          </div>
                        )}

                        {/* Hover highlight line */}
                        {isHovered && (
                          <div className="absolute inset-0 bg-white/[0.06] rounded-sm pointer-events-none" />
                        )}

                        {/* Enhanced Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-gray-900/95 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white whitespace-nowrap pointer-events-none z-50 shadow-xl shadow-black/40 min-w-[140px]">
                            <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1">
                              <Target className="w-2.5 h-2.5" />
                              {level.price.toFixed(decDigits)}
                            </div>
                            <div className="space-y-0.5 text-gray-300">
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Volume</span>
                                <span className="font-medium tabular-nums">{(level.volume / 1000).toFixed(1)}K</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">TPO</span>
                                <span className="font-medium tabular-nums">{level.tpoCount}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Delta</span>
                                <span className={`font-medium tabular-nums ${level.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {level.delta >= 0 ? '+' : ''}{(level.delta / 1000).toFixed(2)}K
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Zone</span>
                                <span className={`font-medium ${isPOC ? 'text-amber-400' : isVA ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {isPOC ? 'POC' : isVA ? 'Value Area' : 'Outside'}
                                </span>
                              </div>
                            </div>
                            {/* Tooltip arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Price line overlay (SVG) */}
                {priceOverlay && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="w-full h-full"
                      style={{ padding: '0 16px' }}
                    >
                      <defs>
                        <linearGradient id="price-overlay-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={priceOverlay.areaPath} fill="url(#price-overlay-grad)" />
                      <polyline
                        points={priceOverlay.polyline}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Price axis labels (left side) */}
              <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between pointer-events-none">
                <span className="text-[8px] text-gray-600 tabular-nums">{maxPrice.toFixed(decDigits)}</span>
                <span className="text-[8px] text-amber-400/50 tabular-nums">{volumeProfile.poc.toFixed(decDigits)}</span>
                <span className="text-[8px] text-gray-600 tabular-nums">{minPrice.toFixed(decDigits)}</span>
              </div>
            </div>

            {/* Delta Distribution Sidebar */}
            <div className="w-[160px] border-l border-white/[0.04] px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Delta Dist</span>
              </div>
              <div className="flex-1 flex items-end gap-[2px]">
                {deltaDistribution.map((bin, i) => {
                  const barHeight = (bin.count / maxBinCount) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end group/bar relative"
                    >
                      <div
                        className={`w-full rounded-t-sm transition-all duration-150 ${
                          bin.isPositive ? 'bg-green-400/40' : 'bg-red-400/40'
                        } group-hover/bar:opacity-100 opacity-70`}
                        style={{ height: `${barHeight}%` }}
                      />
                      {/* Mini tooltip on hover */}
                      <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-white whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-50">
                        {bin.range} ({bin.count})
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Labels */}
              <div className="flex justify-between mt-1">
                <span className="text-[7px] text-red-400/60">Sell</span>
                <span className="text-[7px] text-gray-600">0</span>
                <span className="text-[7px] text-green-400/60">Buy</span>
              </div>

              {/* Cumulative delta mini chart */}
              {candles.length > 1 && (
                <div className="mt-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-2.5 h-2.5 text-gray-500" />
                    <span className="text-[8px] text-gray-600 uppercase">Cum Δ Trend</span>
                  </div>
                  <DeltaTrendLine candles={candles.slice(-30)} />
                </div>
              )}
            </div>
          </div>

          {/* Thin accent line at top */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent -mt-[1px]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeltaTrendLine({ candles }: { candles: { delta?: number }[] }) {
  if (candles.length < 2) return null;

  // Compute cumulative delta
  let cumDelta = 0;
  const points: number[] = [];
  candles.forEach((c) => {
    cumDelta += c.delta || 0;
    points.push(cumDelta);
  });

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 120;
  const h = 24;

  const svgPoints = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${h} ${svgPoints} ${w},${h}`;
  const isUp = cumDelta >= 0;
  const strokeColor = isUp ? '#4ade80' : '#f87171';

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="delta-trend-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#delta-trend-grad)" />
      <polyline points={svgPoints} fill="none" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}
