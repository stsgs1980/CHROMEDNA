'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';
import { ENERGY_SYMBOLS, EnergySymbol } from '@/types/energy';
import { generateEnergyData } from '@/lib/energyGenerators';

const WATCHLIST_SYMBOLS: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];

// Mini 20-point sparkline SVG
function MiniSparkline({ data, color, width = 56, height = 20 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 1;
  const chartH = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = chartH - ((v - min) / range) * chartH + padding;
    return `${x},${y}`;
  }).join(' ');

  // Area fill path
  const firstX = padding;
  const lastX = width - padding;
  const areaPath = `M ${firstX},${height} ${points.split(' ').map(p => `L ${p}`).join(' ')} L ${lastX},${height} Z`;

  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-grad-${color.replace('#', '')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

// Volume mini bar
function VolumeBar({ volume, maxVolume }: { volume: number; maxVolume: number }) {
  const pct = Math.min(100, (volume / maxVolume) * 100);
  return (
    <div className="w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-amber-500/50"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function WatchlistCard({ sym, isActive, onClick, index }: { sym: EnergySymbol; isActive: boolean; onClick: () => void; index: number }) {
  const symbol = useMarketStore((s) => s.symbol);
  const candles = useMarketStore((s) => s.candles);
  const info = ENERGY_SYMBOLS[sym];

  // Use active symbol's candles, or generate for non-active symbols
  const symbolData = useMemo(() => {
    if (sym === symbol && candles.length > 0) {
      return candles;
    }
    // Generate deterministic data for non-active symbols using symbol as seed
    // Use a simple seeded approach based on symbol name
    return generateEnergyData(sym, 50);
  }, [sym, symbol, candles]);

  const { price, changePercent, sparklineData, volume, maxVolume } = useMemo(() => {
    if (symbolData.length < 2) {
      return { price: 0, changePercent: 0, sparklineData: [], volume: 0, maxVolume: 1 };
    }

    const last20 = symbolData.slice(-20);
    const firstCandle = symbolData[0];
    const lastCandle = symbolData[symbolData.length - 1];
    const price = lastCandle.close;
    const changePercent = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
    const sparklineData = last20.map(c => c.close);
    const volume = lastCandle.volume;
    const maxVolume = Math.max(...last20.map(c => c.volume));

    return { price, changePercent, sparklineData, volume, maxVolume };
  }, [symbolData]);

  const isPositive = changePercent >= 0;
  const decDigits = sym === 'CL' ? 2 : 4;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.4)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        glass-card-enhanced rounded-lg p-2.5 cursor-pointer transition-all duration-200 select-none
        ${isActive
          ? 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
          : 'border-white/[0.06] hover:border-white/[0.12]'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: info.buyerColor, boxShadow: `0 0 5px ${info.buyerColor}60` }}
          />
          <span className="text-[11px] font-bold text-white tracking-wide">{sym}</span>
          <span className="text-[8px] text-gray-500 hidden sm:inline">{info.name.split(' ').slice(0, 2).join(' ')}</span>
        </div>
        <span
          className={`text-[9px] font-bold tabular-nums px-1 py-0.5 rounded ${
            isPositive
              ? 'bg-green-500/15 text-green-400'
              : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold tabular-nums text-white truncate">
            {price.toFixed(decDigits)}
          </div>
        </div>
        <div className="w-14 flex-shrink-0">
          <MiniSparkline data={sparklineData} color={isPositive ? '#4ade80' : '#f87171'} />
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <VolumeBar volume={volume} maxVolume={maxVolume} />
        <span className="text-[8px] text-gray-500 tabular-nums flex-shrink-0">
          {(volume / 1000).toFixed(0)}K
        </span>
      </div>
    </motion.div>
  );
}

export function Watchlist() {
  const symbol = useMarketStore((s) => s.symbol);
  const setSymbol = useMarketStore((s) => s.setSymbol);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Watchlist</span>
        <span className="text-[9px] text-gray-600 ml-auto">4 symbols</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {WATCHLIST_SYMBOLS.map((sym, i) => (
          <WatchlistCard
            key={sym}
            sym={sym}
            isActive={sym === symbol}
            onClick={() => setSymbol(sym)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
