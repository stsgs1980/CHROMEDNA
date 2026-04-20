'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge as GaugeIcon } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';

// 5 zones for the semicircular gauge
const ZONES = [
  { label: 'Extreme Fear', min: -100, max: -50, color: '#ef4444' },    // red
  { label: 'Fear', min: -50, max: -15, color: '#f97316' },             // orange-red
  { label: 'Neutral', min: -15, max: 15, color: '#fbbf24' },           // amber
  { label: 'Greed', min: 15, max: 50, color: '#4ade80' },              // green
  { label: 'Extreme Greed', min: 50, max: 100, color: '#22c55e' },     // bright green
];

function getZoneForValue(value: number) {
  for (const zone of ZONES) {
    if (value >= zone.min && value < zone.max) return zone;
  }
  if (value >= 50) return ZONES[4];
  return ZONES[0];
}

export function SentimentGauge() {
  const candles = useMarketStore((s) => s.candles);
  const aiScore = useMarketStore((s) => s.aiScore);
  const orderFlow = useMarketStore((s) => s.orderFlow);
  const symbol = useMarketStore((s) => s.symbol);

  // Animated needle position
  const [displayValue, setDisplayValue] = useState(0);
  const targetValueRef = useRef(0);

  // Calculate sentiment value from: AI score + order flow delta + candle direction ratio
  const sentimentValue = useMemo(() => {
    if (candles.length < 10) return 0;

    // Component 1: AI score (0-100 mapped to -100 to +100)
    const aiComponent = aiScore ? (aiScore.score - 50) * 2 : 0;

    // Component 2: Order flow delta (cumulative delta normalized)
    const deltaComponent = orderFlow
      ? Math.max(-100, Math.min(100, (orderFlow.cumulativeDelta / 5000) * 100))
      : 0;

    // Component 3: Candle direction ratio (ratio of bullish candles in last 20)
    const recent20 = candles.slice(-20);
    const bullishCount = recent20.filter(c => c.close >= c.open).length;
    const directionRatio = ((bullishCount / recent20.length) - 0.5) * 200; // -100 to +100

    // Weighted combination: AI 40%, Delta 30%, Direction 30%
    const combined = aiComponent * 0.4 + deltaComponent * 0.3 + directionRatio * 0.3;
    return Math.max(-100, Math.min(100, Math.round(combined)));
  }, [candles, aiScore, orderFlow, symbol]);

  // Smooth needle animation
  useEffect(() => {
    targetValueRef.current = sentimentValue;
  }, [sentimentValue]);

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setDisplayValue(prev => {
        const target = targetValueRef.current;
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        return prev + diff * 0.08;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Historical readings (last 10, simulated from candle direction ratios)
  const historicalReadings = useMemo(() => {
    if (candles.length < 20) return [];
    const readings: number[] = [];
    for (let i = 0; i < 10; i++) {
      const startIdx = Math.max(0, candles.length - 20 - i * 5);
      const endIdx = Math.max(20, candles.length - i * 5);
      const slice = candles.slice(startIdx, endIdx);
      if (slice.length < 5) {
        readings.push(0);
        continue;
      }
      const bullish = slice.filter(c => c.close >= c.open).length;
      const ratio = ((bullish / slice.length) - 0.5) * 200;
      // Add small variation
      const variation = ((slice[slice.length - 1]?.time || 0) % 100) / 100 * 10 - 5;
      readings.push(Math.max(-100, Math.min(100, Math.round(ratio + variation))));
    }
    return readings.reverse();
  }, [candles]);

  const currentZone = getZoneForValue(sentimentValue);

  // SVG gauge calculations
  const gaugeWidth = 240;
  const gaugeHeight = 130;
  const cx = gaugeWidth / 2;
  const cy = gaugeHeight - 15;
  const outerR = 95;
  const innerR = 70;

  // Arc from 180° (left) to 0° (right) — semicircle
  const polarToCartesian = (angleDeg: number, radius: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };

  // Value (-100 to 100) mapped to angle (180 to 0)
  const valueToAngle = (val: number) => 180 - ((val + 100) / 200) * 180;

  // Draw zone arcs
  const zoneArcs = ZONES.map((zone) => {
    const startAngle = valueToAngle(zone.max);
    const endAngle = valueToAngle(zone.min);
    const start = polarToCartesian(startAngle, outerR);
    const end = polarToCartesian(endAngle, outerR);
    const startInner = polarToCartesian(startAngle, innerR);
    const endInner = polarToCartesian(endAngle, innerR);
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

    const path = [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
      'Z',
    ].join(' ');

    return { path, color: zone.color, label: zone.label };
  });

  // Needle
  const needleAngle = valueToAngle(displayValue);
  const needleTip = polarToCartesian(needleAngle, outerR - 5);
  const needleBase1 = polarToCartesian(needleAngle - 3, 12);
  const needleBase2 = polarToCartesian(needleAngle + 3, 12);

  // Tick marks
  const ticks = [];
  for (let val = -100; val <= 100; val += 25) {
    const angle = valueToAngle(val);
    const outer = polarToCartesian(angle, outerR + 3);
    const inner = polarToCartesian(angle, outerR - (val % 50 === 0 ? 8 : 4));
    ticks.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, isMajor: val % 50 === 0 });
  }

  // Sparkline for historical readings
  const sparklineWidth = 200;
  const sparklineHeight = 24;
  const sparklinePoints = historicalReadings.length > 1
    ? historicalReadings.map((v, i) => {
        const x = (i / (historicalReadings.length - 1)) * sparklineWidth;
        const y = sparklineHeight / 2 - (v / 100) * (sparklineHeight / 2 - 2);
        return `${x},${y}`;
      }).join(' ')
    : '';

  const zeroLineColor = '#6b7280';

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <GaugeIcon className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sentiment Gauge</span>
      </div>
      <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
        {/* SVG Semicircular Gauge */}
        <svg width="100%" viewBox={`0 0 ${gaugeWidth} ${gaugeHeight}`} className="w-full max-w-[260px] mx-auto">
          {/* Zone arcs */}
          {zoneArcs.map((arc, i) => (
            <path
              key={i}
              d={arc.path}
              fill={arc.color}
              opacity="0.25"
            />
          ))}

          {/* Active zone highlight */}
          {(() => {
            const activeArc = zoneArcs.find(a => a.label === currentZone.label);
            if (!activeArc) return null;
            return (
              <path
                d={activeArc.path}
                fill={activeArc.color}
                opacity="0.55"
              />
            );
          })()}

          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1} y1={tick.y1}
              x2={tick.x2} y2={tick.y2}
              stroke={tick.isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={tick.isMajor ? 1.5 : 0.75}
            />
          ))}

          {/* Labels at extremes */}
          <text x={polarToCartesian(180, outerR + 14).x} y={polarToCartesian(180, outerR + 14).y} textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold" opacity="0.7">-100</text>
          <text x={polarToCartesian(90, outerR + 14).x} y={polarToCartesian(90, outerR + 14).y} textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold" opacity="0.7">0</text>
          <text x={polarToCartesian(0, outerR + 14).x} y={polarToCartesian(0, outerR + 14).y} textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="bold" opacity="0.7">+100</text>

          {/* Zero line */}
          {(() => {
            const zeroTop = polarToCartesian(90, outerR);
            const zeroBottom = polarToCartesian(90, innerR);
            return (
              <line
                x1={zeroTop.x} y1={zeroTop.y}
                x2={zeroBottom.x} y2={zeroBottom.y}
                stroke={zeroLineColor}
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })()}

          {/* Needle */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={currentZone.color}
            opacity="0.9"
            style={{ filter: `drop-shadow(0 0 3px ${currentZone.color}60)` }}
          />

          {/* Center circle */}
          <circle cx={cx} cy={cy} r="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="3" fill={currentZone.color} opacity="0.7" />

          {/* Glow filter */}
          <defs>
            <filter id="needle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Current reading label and value */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentZone.color, boxShadow: `0 0 6px ${currentZone.color}60` }}
            />
            <span className="text-xs font-bold" style={{ color: currentZone.color }}>
              {currentZone.label}
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: currentZone.color }}>
            {sentimentValue >= 0 ? '+' : ''}{Math.round(displayValue)}
          </span>
        </div>

        {/* Component breakdown */}
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <div className="metric-card-enhanced rounded px-2 py-1">
            <div className="data-label">AI Score</div>
            <div className="text-[10px] font-semibold tabular-nums text-amber-400">
              {aiScore ? `${aiScore.score}/100` : 'N/A'}
            </div>
          </div>
          <div className="metric-card-enhanced rounded px-2 py-1">
            <div className="data-label">Flow Delta</div>
            <div className={`text-[10px] font-semibold tabular-nums ${orderFlow && orderFlow.cumulativeDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {orderFlow ? `${(orderFlow.cumulativeDelta / 1000).toFixed(1)}K` : 'N/A'}
            </div>
          </div>
          <div className="metric-card-enhanced rounded px-2 py-1">
            <div className="data-label">Direction</div>
            <div className="text-[10px] font-semibold tabular-nums text-amber-400">
              {candles.length >= 10
                ? `${candles.slice(-20).filter(c => c.close >= c.open).length}/20`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Historical sparkline */}
        {historicalReadings.length > 1 && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-gray-600 uppercase tracking-wider">Historical Trend</span>
              <span className="text-[8px] text-gray-600">Last 10 readings</span>
            </div>
            <svg width="100%" height={sparklineHeight + 8} viewBox={`0 0 ${sparklineWidth} ${sparklineHeight + 8}`} className="w-full">
              {/* Zero line */}
              <line
                x1="0" y1={sparklineHeight / 2 + 4}
                x2={sparklineWidth} y2={sparklineHeight / 2 + 4}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
              {/* Area fill */}
              {sparklinePoints && (() => {
                const points = sparklinePoints.split(' ');
                const firstX = points[0].split(',')[0];
                const lastX = points[points.length - 1].split(',')[0];
                const areaPath = `M ${firstX},${sparklineHeight / 2 + 4} ${points.map(p => `L ${p}`).join(' ')} L ${lastX},${sparklineHeight / 2 + 4} Z`;
                return (
                  <path
                    d={areaPath}
                    fill={currentZone.color}
                    opacity="0.08"
                  />
                );
              })()}
              {/* Line */}
              {sparklinePoints && (
                <polyline
                  points={sparklinePoints}
                  fill="none"
                  stroke={currentZone.color}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                  transform={`translate(0, 4)`}
                />
              )}
              {/* Current dot */}
              {historicalReadings.length > 0 && (() => {
                const lastVal = historicalReadings[historicalReadings.length - 1];
                const x = sparklineWidth;
                const y = sparklineHeight / 2 - (lastVal / 100) * (sparklineHeight / 2 - 2) + 4;
                return (
                  <circle
                    cx={x} cy={y} r="2.5"
                    fill={currentZone.color}
                    opacity="0.8"
                  />
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
