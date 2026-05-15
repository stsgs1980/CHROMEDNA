/**
 * SignalComponents - Trading signal UI components
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@zai/ui-kit';
import { SignalType } from '@/types/energy';

export function SignalIcon({ signal }: { signal: SignalType }) {
  if (signal === 'BULLISH') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (signal === 'BEARISH') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

export function SignalBadge({ signal }: { signal: SignalType }) {
  const colors = {
    BULLISH: 'border-green-500/50 text-green-400 bg-green-500/10',
    BEARISH: 'border-red-500/50 text-red-400 bg-red-500/10',
    NEUTRAL: 'border-gray-500/50 text-gray-400 bg-gray-500/10',
  };
  return (
    <Badge variant="outline" className={colors[signal]}>
      <SignalIcon signal={signal} />
      <span className="ml-1">{signal}</span>
    </Badge>
  );
}

// Re-export MetricCard for convenience
export { MetricCard };
