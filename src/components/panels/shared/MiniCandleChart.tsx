/**
 * MiniCandleChart - Re-export from @zai/ui-kit with CHROMEDNA styling
 */

'use client';

import { MiniCandleChart as BaseMiniCandleChart, MiniCandleChartProps } from '@zai/ui-kit';

export function MiniCandleChart(props: MiniCandleChartProps) {
  return (
    <div className="animated-gradient-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="data-label">Price Chart (Last 20)</span>
        <span className="text-[9px] text-gray-600">{props.candles.length} candles</span>
      </div>
      <BaseMiniCandleChart {...props} />
    </div>
  );
}

export type { MiniCandleChartProps };
