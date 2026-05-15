'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Brain, Droplets, Thermometer, Activity, Gauge } from 'lucide-react';
import { Watchlist } from '@/components/panels/Watchlist';
import { RiskCalculator } from '@/components/panels/RiskCalculator';
import { PerformanceHeatmap } from '@/components/panels/PerformanceHeatmap';
import { MultiTimeframeComparison } from '@/components/panels/MultiTimeframeComparison';
import { SentimentGauge } from '@/components/panels/SentimentGauge';
import { TechnicalIndicators } from '@/components/panels/TechnicalIndicators';
import { OrderFlowSection } from '@/components/panels/OrderFlowSection';
import { CorrelationMatrix } from '@/components/panels/CorrelationMatrix';
import { MarketRegimeIndicator } from '@/components/panels/MarketRegimeIndicator';
import { MiniCandleChart } from '@/components/panels/shared/MiniCandleChart';
import { SignalIcon, SignalBadge, MetricCard } from '@/components/panels/shared/SignalComponents';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { ENERGY_SYMBOLS } from '@/types/energy';

export function RightPanel() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const symbol = useMarketStore((s) => s.symbol);
  const candles = useMarketStore((s) => s.candles);
  const selectedCandleIndex = useMarketStore((s) => s.selectedCandleIndex);
  const aiScore = useMarketStore((s) => s.aiScore);
  const info = ENERGY_SYMBOLS[symbol];

  const candle = selectedCandleIndex !== null ? candles[selectedCandleIndex] : candles[candles.length - 1];
  const last20Candles = useMemo(() => candles.slice(-20), [candles]);

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
              <CandleDetailsSection candle={candle} symbol={symbol} info={info} selectedCandleIndex={selectedCandleIndex} />

              {/* Mini Candle Chart */}
              <MiniCandleChart candles={last20Candles} />

              <div className="section-divider-enhanced" />

              {/* AI Score with Gauge */}
              <AIScoreSection aiScore={aiScore} scoreArc={scoreArc} />

              <div className="section-divider-enhanced" />

              {/* Technical Indicators */}
              <TechnicalIndicators />

              <div className="section-divider-enhanced" />

              {/* Order Flow Section */}
              <OrderFlowSection />

              <div className="section-divider-enhanced" />

              {/* Energy Metrics */}
              <EnergyMetricsSection candle={candle} />

              <div className="section-divider-enhanced" />

              {/* Risk Calculator */}
              <RiskCalculator />

              <div className="section-divider-enhanced" />

              {/* Performance Heatmap */}
              <PerformanceHeatmap />

              <div className="section-divider-enhanced" />

              {/* Cross-Symbol Correlation Matrix */}
              <CorrelationMatrix />

              <div className="section-divider-enhanced" />

              {/* Market Regime Indicator */}
              <MarketRegimeIndicator />

              <div className="section-divider-enhanced" />

              {/* Sentiment Gauge */}
              <SentimentGauge />

              <div className="section-divider-enhanced" />

              {/* Watchlist */}
              <Watchlist />

              <div className="section-divider-enhanced" />

              {/* Multi-Timeframe Comparison */}
              <MultiTimeframeComparison />

              <div className="h-4" />
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// Sub-components for RightPanel

function CandleDetailsSection({ candle, symbol, info, selectedCandleIndex }: { candle: any; symbol: string; info: any; selectedCandleIndex: number | null }) {
  if (!candle) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Candle Details</span>
        </div>
        <div className="text-xs text-gray-600 text-center py-4">No data available</div>
      </div>
    );
  }

  const decDigits = symbol === 'CL' ? 2 : 4;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {selectedCandleIndex !== null ? `Candle #${selectedCandleIndex + 1}` : 'Latest Candle'}
        </span>
        <span className="text-[9px] text-gray-600 ml-auto">{symbol} · {info.unit}</span>
      </div>
      <div className="space-y-2">
        <div className={`h-1 rounded-full ${
          candle.close >= candle.open
            ? 'bg-gradient-to-r from-green-500/60 via-green-400/80 to-green-500/60'
            : 'bg-gradient-to-r from-red-500/60 via-red-400/80 to-red-500/60'
        }`} />
        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard label="Open" value={candle.open.toFixed(decDigits)} />
          <MetricCard label="High" value={candle.high.toFixed(decDigits)} color="text-green-400" />
          <MetricCard label="Low" value={candle.low.toFixed(decDigits)} color="text-red-400" />
          <MetricCard label="Close" value={candle.close.toFixed(decDigits)} color={candle.close >= candle.open ? 'text-green-400' : 'text-red-400'} subtext={candle.close >= candle.open ? 'Bullish' : 'Bearish'} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard
            label="Change"
            value={`${candle.close >= candle.open ? '+' : ''}${(candle.close - candle.open).toFixed(decDigits)}`}
            color={candle.close >= candle.open ? 'text-green-400' : 'text-red-400'}
            subtext={`${(((candle.close - candle.open) / candle.open) * 100).toFixed(2)}%`}
          />
          <MetricCard label="Range" value={`${(candle.high - candle.low).toFixed(decDigits)}`} color="text-amber-400" subtext="H - L" />
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
    </div>
  );
}

function AIScoreSection({ aiScore, scoreArc }: { aiScore: any; scoreArc: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Composite</span>
      </div>
      {aiScore && scoreArc ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 ai-gauge-glow">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" strokeDasharray="132 176" strokeDashoffset="-44" strokeLinecap="round" />
                <defs>
                  <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <path d={scoreArc.path} fill="none" stroke={scoreArc.color} strokeWidth="5" strokeLinecap="round" filter="url(#gauge-glow)" />
                <text x="36" y="34" textAnchor="middle" className="text-lg font-bold" fill="white" fontSize="16" fontFamily="monospace">{aiScore.score}</text>
                <text x="36" y="46" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">/ 100</text>
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
                  <motion.div initial={{ width: 0 }} animate={{ width: `${aiScore.confidence}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 confidence-bar-fill" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {aiScore.components.map((comp: any) => {
              const barColor = comp.signal === 'BULLISH' ? 'from-green-500 to-green-400' : comp.signal === 'BEARISH' ? 'from-red-500 to-red-400' : 'from-gray-500 to-gray-400';
              const barBg = comp.signal === 'BULLISH' ? 'bg-green-500/10' : comp.signal === 'BEARISH' ? 'bg-red-500/10' : 'bg-gray-500/10';
              return (
                <div key={comp.name} className={`${barBg} rounded-md px-2.5 py-1.5`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-300 font-medium">{comp.name}</span>
                    <div className="flex items-center gap-1.5">
                      <SignalIcon signal={comp.signal} />
                      <span className="text-[9px] text-gray-500 tabular-nums">{comp.weight}%</span>
                    </div>
                  </div>
                  <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${comp.value}%` }} />
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
  );
}

function EnergyMetricsSection({ candle }: { candle: any }) {
  if (!candle) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Energy Metrics</span>
      </div>
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
            {candle.eiaExpectation === 'draw' ? 'Draw' : candle.eiaExpectation === 'build' ? 'Build' : candle.eiaExpectation?.toUpperCase() || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 px-3 rounded-md bg-white/[0.03] border border-white/[0.03] energy-metric-item">
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] text-gray-400">Weather Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-[4px] bg-white/[0.05] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${Math.abs(candle.weatherImpact || 0) > 50 ? 'bg-orange-400' : 'bg-gray-500/50'}`} style={{ width: `${Math.min(100, Math.abs(candle.weatherImpact || 0))}%` }} />
            </div>
            <span className={`text-[11px] font-semibold tabular-nums ${Math.abs(candle.weatherImpact || 0) > 50 ? 'text-orange-400' : 'text-gray-400'}`}>
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
          </span>
        </div>
      </div>
    </div>
  );
}
