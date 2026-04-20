'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Play, Pause, Zap, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { ENERGY_SYMBOLS, EnergySymbol } from '@/types/energy';
import { DECOMPOSITION_LEVELS } from '@/types/energy';

const SYMBOLS: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];

// EIA countdown logic
function getNextEIA(): Date {
  const now = new Date();
  const day = now.getDay();
  let daysUntilWed = (3 + 7 - day) % 7;
  if (daysUntilWed === 0) {
    // It's Wednesday - check if before 10:30 AM
    if (now.getHours() < 10 || (now.getHours() === 10 && now.getMinutes() < 30)) {
      daysUntilWed = 0;
    } else {
      daysUntilWed = 7;
    }
  }
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilWed);
  next.setHours(10, 30, 0, 0);
  return next;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'NOW!';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function EIACountdown() {
  const [countdown, setCountdown] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const toggleEIAReport = useUIStore((s) => s.toggleEIAReport);

  useEffect(() => {
    const update = () => {
      const next = getNextEIA();
      const diff = next.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
      setIsUrgent(diff > 0 && diff < 3600000); // Less than 1 hour
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={toggleEIAReport}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-all duration-300 cursor-pointer ${
        isUrgent
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 animate-amber-pulse shadow-sm shadow-amber-500/10 hover:bg-amber-500/25'
          : 'border-white/[0.06] bg-white/[0.03] text-gray-400 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/10'
      }`}
      title="View EIA Report"
    >
      <Clock className={`w-3 h-3 transition-transform duration-300 ${isUrgent ? 'animate-glow-breathe' : ''}`} />
      <span className="hidden lg:inline">EIA</span>
      <span className="tabular-nums number-transition">{countdown}</span>
    </button>
  );
}

function MiniSparkline({ candles, isUp, width = 80, height = 28 }: { candles: number[]; isUp: boolean; width?: number; height?: number }) {
  if (candles.length < 2) return null;

  const min = Math.min(...candles);
  const max = Math.max(...candles);
  const range = max - min || 1;

  const points = candles
    .map((v, i) => {
      const x = (i / (candles.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const strokeColor = isUp ? '#4ade80' : '#f87171';
  const fillColor = isUp ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)';

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={`spark-grad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-grad-${isUp ? 'up' : 'down'})`} />
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      {candles.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((candles[candles.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r="2.5" fill={strokeColor} />;
      })()}
    </svg>
  );
}

function TrendIndicator({ change, changePercent }: { change: number; changePercent: number }) {
  const isUp = change >= 0;
  return (
    <div className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{isUp ? '+' : ''}{changePercent.toFixed(2)}%</span>
    </div>
  );
}

export function Header() {
  const symbol = useMarketStore((s) => s.symbol);
  const setSymbol = useMarketStore((s) => s.setSymbol);
  const decompositionLevel = useMarketStore((s) => s.decompositionLevel);
  const setDecompositionLevel = useMarketStore((s) => s.setDecompositionLevel);
  const isLive = useMarketStore((s) => s.isLive);
  const setLive = useMarketStore((s) => s.setLive);
  const candles = useMarketStore((s) => s.candles);
  const aiScore = useMarketStore((s) => s.aiScore);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const setAutoRotate = useUIStore((s) => s.setAutoRotate);

  const info = ENERGY_SYMBOLS[symbol];
  const latestCandle = candles[candles.length - 1];
  const price = latestCandle?.close ?? 0;
  const change = latestCandle ? latestCandle.close - latestCandle.open : 0;
  const changePercent = latestCandle ? ((change / latestCandle.open) * 100) : 0;
  const isUp = change >= 0;

  const sparklineData = useMemo(() => {
    const last30 = candles.slice(-30).map((c) => c.close);
    return last30;
  }, [candles]);

  const decDigits = symbol === 'CL' ? 2 : 4;

  // Session high/low from visible candles
  const sessionHigh = useMemo(() => {
    const last20 = candles.slice(-20);
    return last20.length > 0 ? Math.max(...last20.map((c) => c.high)) : 0;
  }, [candles]);

  const sessionLow = useMemo(() => {
    const last20 = candles.slice(-20);
    return last20.length > 0 ? Math.min(...last20.map((c) => c.low)) : 0;
  }, [candles]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel"
    >
      <div className="flex items-center justify-between h-14 px-3 lg:px-4 gap-2">
        {/* Logo & Symbol Name */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 active-glow-amber relative overflow-hidden">
            <Zap className="w-4 h-4 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold text-white tracking-tight">
              CHROME<span className="text-gradient-amber">DNA</span>
            </span>
            <span className="text-[10px] text-gray-500 block leading-tight -mt-0.5">Energy Edition</span>
          </div>
        </div>

        {/* Symbol Selector + Full Name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.04] gradient-border-amber">
            {SYMBOLS.map((s) => {
              const sInfo = ENERGY_SYMBOLS[s];
              const isActive = symbol === s;
              return (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/10 border border-amber-500/30 active-glow-amber'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 hover:shadow-sm'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[11px] font-medium text-gray-300 leading-tight">{info.name}</span>
            <span className="text-[9px] text-gray-600">{info.unit}</span>
          </div>
        </div>

        {/* Price Display + Sparkline */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <MiniSparkline candles={sparklineData} isUp={isUp} width={72} height={24} />
            <div className="text-right">
              <div className="text-white font-bold text-base lg:text-lg tabular-nums leading-tight">
                {price.toFixed(decDigits)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '+' : ''}{change.toFixed(decDigits)}
                </span>
                <TrendIndicator change={change} changePercent={changePercent} />
              </div>
            </div>
          </div>

          {/* Session Range */}
          <div className="hidden xl:flex flex-col items-end text-[9px] text-gray-500 tabular-nums border-l border-white/[0.06] pl-3 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />
            <span>H: <span className="text-green-400/80 number-transition">{sessionHigh.toFixed(decDigits)}</span></span>
            <span>L: <span className="text-red-400/80 number-transition">{sessionLow.toFixed(decDigits)}</span></span>
          </div>
        </div>

        {/* AI Score Badge */}
        {aiScore && (
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
            aiScore.signal === 'BULLISH'
              ? 'border-green-500/30 bg-green-500/10 active-glow-green'
              : aiScore.signal === 'BEARISH'
              ? 'border-red-500/30 bg-red-500/10 active-glow-red'
              : 'border-gray-500/30 bg-gray-500/10'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              aiScore.signal === 'BULLISH' ? 'bg-green-400 animate-pulse glow-dot-green' :
              aiScore.signal === 'BEARISH' ? 'bg-red-400 animate-pulse glow-dot-red' : 'bg-gray-400'
            }`} />
            <span className={`text-xs font-bold number-transition ${
              aiScore.signal === 'BULLISH' ? 'text-green-400' :
              aiScore.signal === 'BEARISH' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {aiScore.score}
            </span>
            <span className={`text-[10px] font-medium ${
              aiScore.signal === 'BULLISH' ? 'text-green-400/70' :
              aiScore.signal === 'BEARISH' ? 'text-red-400/70' : 'text-gray-400/70'
            }`}>
              {aiScore.signal}
            </span>
          </div>
        )}

        {/* EIA Countdown */}
        <EIACountdown />

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Decomposition Level - compact on mobile */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-md p-0.5 border border-white/[0.03] gradient-border-amber">
            {DECOMPOSITION_LEVELS.map((level) => (
              <button
                key={level.level}
                onClick={() => setDecompositionLevel(level.level)}
                className={`h-6 px-1.5 rounded text-[10px] font-bold transition-all duration-200 ${
                  decompositionLevel === level.level
                    ? 'bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/5 active-glow-amber'
                    : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
                }`}
              >
                {level.level}
              </button>
            ))}
          </div>

          {/* Live Toggle */}
          <button
            onClick={() => setLive(!isLive)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-300 hover:scale-[1.02] ${
              isLive
                ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-sm shadow-green-500/10 active-glow-green'
                : 'bg-white/[0.04] text-gray-500 border border-white/[0.04] hover:text-gray-300 hover:border-white/[0.08]'
            }`}
          >
            {isLive ? (
              <Activity className="w-3 h-3 animate-pulse" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{isLive ? 'LIVE' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Gradient accent line at bottom of header */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent" />
      </div>
    </motion.header>
  );
}
