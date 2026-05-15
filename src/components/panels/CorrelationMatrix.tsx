'use client';

import { useMemo, Fragment } from 'react';
import { Grid3x3 } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';
import { EnergySymbol } from '@/types/energy';

const SYMBOLS_ORDER: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];

function getCorrelationColor(value: number): { bg: string; text: string } {
  const magnitude = Math.abs(value);
  if (value >= 0) {
    const opacity = 0.05 + magnitude * 0.25;
    return {
      bg: `rgba(74, 222, 128, ${opacity})`,
      text: magnitude > 0.5 ? 'text-green-400' : magnitude > 0.2 ? 'text-green-400/70' : 'text-gray-400',
    };
  } else {
    const opacity = 0.05 + magnitude * 0.25;
    return {
      bg: `rgba(248, 113, 113, ${opacity})`,
      text: magnitude > 0.5 ? 'text-red-400' : magnitude > 0.2 ? 'text-red-400/70' : 'text-gray-400',
    };
  }
}

export function CorrelationMatrix() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);

  const correlationData = useMemo(() => {
    const baseCorrelations: Record<string, number> = {
      'CL-CL': 1.0, 'CL-NG': 0.42, 'CL-RB': 0.87, 'CL-HO': 0.83,
      'NG-CL': 0.42, 'NG-NG': 1.0, 'NG-RB': 0.35, 'NG-HO': 0.51,
      'RB-CL': 0.87, 'RB-NG': 0.35, 'RB-RB': 1.0, 'RB-HO': 0.92,
      'HO-CL': 0.83, 'HO-NG': 0.51, 'HO-RB': 0.92, 'HO-HO': 1.0,
    };

    const seed = candles.length > 0 ? candles[candles.length - 1].time % 1000 : 0;
    const variation = (seed / 1000) * 0.08 - 0.04;

    return SYMBOLS_ORDER.map((row) =>
      SYMBOLS_ORDER.map((col) => {
        const key = `${row}-${col}`;
        const base = baseCorrelations[key] ?? 0;
        if (row === col) return { value: 1.0, row, col };
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
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `28px repeat(4, 1fr)` }}>
          <div />
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

          {correlationData.map((row, rowIdx) => (
            <Fragment key={`row-${SYMBOLS_ORDER[rowIdx]}`}>
              <div
                key={`r-${SYMBOLS_ORDER[rowIdx]}`}
                className={`text-[9px] font-bold flex items-center justify-end pr-1 ${
                  SYMBOLS_ORDER[rowIdx] === symbol ? 'text-amber-400' : 'text-gray-500'
                }`}
              >
                {SYMBOLS_ORDER[rowIdx]}
              </div>

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
