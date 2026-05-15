'use client';

import { Scale, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';
import { MetricCard } from './shared/SignalComponents';

export function OrderFlowSection() {
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
                <div className="flex-1 flex items-center">
                  <div className="h-[6px] bg-green-500/40 rounded-l-sm" style={{ width: `${buyWidth}%` }} />
                  <div className="h-[6px] bg-red-500/40 rounded-r-sm" style={{ width: `${sellWidth}%`, marginLeft: '1px' }} />
                </div>
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
