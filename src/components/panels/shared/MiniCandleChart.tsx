'use client';

interface MiniCandleChartProps {
  candles: { open: number; high: number; low: number; close: number }[];
  width?: number;
  height?: number;
}

export function MiniCandleChart({ candles, width = 248, height = 80 }: MiniCandleChartProps) {
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
        {candles.length > 1 && (() => {
          const firstX = padding + gap / 2;
          const lastX = padding + (candles.length - 1) * gap + gap / 2;
          const areaPath = `M ${firstX},${height} ${closeLine.split(' ').map(p => `L ${p}`).join(' ')} L ${lastX},${height} Z`;
          return <path d={areaPath} fill="url(#close-line-grad)" />;
        })()}
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
              <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={colorFaded} strokeWidth="1" />
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
        <polyline points={closeLine} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      </svg>
    </div>
  );
}
