'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';

type RegimeType = 'TRENDING' | 'RANGING' | 'VOLATILE' | 'QUIET';

export function MarketRegimeIndicator() {
  const candles = useMarketStore((s) => s.candles);

  const regime = useMemo<{ type: RegimeType; strength: number; label: string; color: string; description: string }>(() => {
    if (candles.length < 20) return { type: 'QUIET', strength: 0, label: 'Insufficient Data', color: '#6b7280', description: 'Not enough data' };

    const recent = candles.slice(-20);
    const closes = recent.map(c => c.close);

    let plusDM = 0;
    let minusDM = 0;
    for (let i = 1; i < recent.length; i++) {
      const highDiff = recent[i].high - recent[i - 1].high;
      const lowDiff = recent[i - 1].low - recent[i].low;
      plusDM += highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
      minusDM += lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;
    }
    const trendStrength = Math.abs(plusDM - minusDM) / (plusDM + minusDM || 1);

    const priceRange = Math.max(...closes) - Math.min(...closes);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const normalizedRange = priceRange / avgPrice;

    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length;
    const volatility = Math.sqrt(variance);

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
  }, [candles]);

  const recent = candles.slice(-20);

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

        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${regime.strength}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: regime.color }}
          />
        </div>

        <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{regime.description}</p>

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
