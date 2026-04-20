'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { ENERGY_SYMBOLS, EnergySymbol } from '@/types/energy';

interface TickerItem {
  symbol: EnergySymbol;
  price: number;
  prevPrice: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  isNeutral: boolean;
}

const SYMBOLS: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];

function getDecimalDigits(symbol: EnergySymbol): number {
  return symbol === 'CL' ? 2 : 4;
}

function generateInitialPrices(): Record<EnergySymbol, number> {
  const prices: Record<EnergySymbol, number> = {} as Record<EnergySymbol, number>;
  for (const sym of SYMBOLS) {
    const info = ENERGY_SYMBOLS[sym];
    // Small random offset from base price for realism
    const offset = (Math.random() - 0.5) * info.basePrice * info.volatility * 2;
    prices[sym] = info.basePrice + offset;
  }
  return prices;
}

function simulateTick(prices: Record<EnergySymbol, number>): Record<EnergySymbol, number> {
  const newPrices = { ...prices };
  for (const sym of SYMBOLS) {
    const info = ENERGY_SYMBOLS[sym];
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const delta = randomFactor * info.basePrice * info.volatility * 0.1;
    newPrices[sym] = Math.max(info.basePrice * 0.5, newPrices[sym] + delta);
  }
  return newPrices;
}

export function LiveTicker() {
  const isLive = useMarketStore((s) => s.isLive);
  const autoRotate = useUIStore((s) => s.autoRotate);

  const [prices, setPrices] = useState<Record<EnergySymbol, number>>(generateInitialPrices);
  const [prevPrices, setPrevPrices] = useState<Record<EnergySymbol, number>>(prices);
  const [tickCount, setTickCount] = useState(0);

  // Simulate live price ticks
  const tick = useCallback(() => {
    setPrevPrices((prev) => {
      // Capture current prices as previous before updating
      setPrices((current) => {
        const updated = simulateTick(current);
        return updated;
      });
      // We return the current prices as prevPrices
      // But we need the actual current - use a ref approach via functional update
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!isLive) return;

    // Random interval between 2-4 seconds
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 2000;
      return setTimeout(() => {
        setPrices((current) => {
          setPrevPrices(current);
          const updated = simulateTick(current);
          return updated;
        });
        setTickCount((c) => c + 1);
      }, delay);
    };

    const timeout = scheduleNext();
    return () => clearTimeout(timeout);
  }, [isLive, tickCount]);

  // Build ticker items from current and previous prices
  const tickerItems = useMemo<TickerItem[]>(() => {
    return SYMBOLS.map((sym) => {
      const price = prices[sym];
      const prevPrice = prevPrices[sym];
      const change = price - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
      const isUp = change > 0.00001;
      const isNeutral = Math.abs(change) <= 0.00001;
      return { symbol: sym, price, prevPrice, change, changePercent, isUp, isNeutral };
    });
  }, [prices, prevPrices]);

  // Duplicate items for seamless infinite scroll
  const scrollItems = useMemo(() => {
    return [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];
  }, [tickerItems]);

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative h-7 overflow-hidden select-none"
      style={{
        background: 'rgba(3, 3, 8, 0.75)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Gradient fades on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(3,3,8,0.95), transparent)' }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(3,3,8,0.95), transparent)' }}
      />

      {/* Scrolling content */}
      <div className="flex items-center h-full animate-ticker-scroll">
        {scrollItems.map((item, idx) => {
          const info = ENERGY_SYMBOLS[item.symbol];
          const decDigits = getDecimalDigits(item.symbol);
          return (
            <div
              key={`${item.symbol}-${idx}`}
              className="flex items-center gap-1.5 px-3 flex-shrink-0"
            >
              {/* Symbol */}
              <span className="text-[11px] font-bold text-amber-400/90 tracking-wide">
                {item.symbol}
              </span>

              {/* Price */}
              <span className="text-[11px] font-semibold text-gray-200 tabular-nums number-transition">
                {item.price.toFixed(decDigits)}
              </span>

              {/* Change arrow + value */}
              <div className={`flex items-center gap-0.5 ${
                item.isUp
                  ? 'text-green-400'
                  : item.isNeutral
                  ? 'text-gray-500'
                  : 'text-red-400'
              }`}>
                {item.isUp ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : item.isNeutral ? (
                  <Minus className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                <span className="text-[10px] font-medium tabular-nums number-transition">
                  {item.isUp ? '+' : ''}{item.change.toFixed(decDigits)}
                </span>
                <span className="text-[9px] font-medium tabular-nums number-transition opacity-70">
                  ({item.isUp ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </span>
              </div>

              {/* Separator dot */}
              <span className="text-amber-500/40 text-[8px] ml-1.5">●</span>
            </div>
          );
        })}
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="absolute left-14 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse glow-dot-green" />
        </div>
      )}

      {/* Auto-rotate indicator */}
      {autoRotate && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse glow-dot-amber" />
        </div>
      )}
    </motion.div>
  );
}
