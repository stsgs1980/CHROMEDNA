/**
 * SignalComponents - Trading signal UI components
 * Re-exports from @zai/ui-kit with CHROMEDNA-specific additions
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SignalBadge as BaseSignalBadge, MetricCard, SignalType } from '@zai/ui-kit';

// Re-export SignalBadge from library
export { SignalBadge } from '@zai/ui-kit';
export type { SignalType } from '@zai/ui-kit';

// SignalIcon remains local (simple icon display)
export function SignalIcon({ signal }: { signal: SignalType }) {
  if (signal === 'BULLISH') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (signal === 'BEARISH') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

// Re-export MetricCard for convenience
export { MetricCard };
