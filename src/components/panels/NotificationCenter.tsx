'use client';

import { useState, useMemo, useCallback } from 'react';
import { Bell, CheckCheck, TrendingUp, TrendingDown, AlertTriangle, Zap, Thermometer, Clock, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketStore } from '@/stores/marketStore';
import { ENERGY_SYMBOLS } from '@/types/energy';

type Severity = 'info' | 'warning' | 'critical';

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: Date;
  severity: Severity;
  read: boolean;
}

function severityColors(severity: Severity) {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400', text: 'text-red-400' };
    case 'warning':
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400', text: 'text-amber-400' };
    case 'info':
      return { bg: 'bg-gray-500/10', border: 'border-gray-500/20', dot: 'bg-gray-400', text: 'text-gray-400' };
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationCenter() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  // Auto-generate alerts from candle data using useMemo (purely derived state)
  const generatedAlerts = useMemo(() => {
    if (candles.length < 10) return [];

    const alerts: Notification[] = [];
    const info = ENERGY_SYMBOLS[symbol];
    const decDigits = symbol === 'CL' ? 2 : 4;
    const recent = candles.slice(-10);
    const latest = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];

    // Large price move detection
    if (latest && prevCandle) {
      const changePercent = ((latest.close - prevCandle.close) / prevCandle.close) * 100;
      if (Math.abs(changePercent) > 1.5) {
        const isUp = changePercent > 0;
        alerts.push({
          id: `price-${latest.time}`,
          icon: isUp ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
          title: `${isUp ? 'Surge' : 'Drop'}: ${info.symbol} ${isUp ? '+' : ''}${changePercent.toFixed(2)}%`,
          description: `Price moved to ${latest.close.toFixed(decDigits)} from ${prevCandle.close.toFixed(decDigits)}`,
          timestamp: new Date(latest.time * 1000),
          severity: Math.abs(changePercent) > 3 ? 'critical' : 'warning',
          read: false,
        });
      }
    }

    // Volume spike detection
    if (recent.length >= 5) {
      const avgVol = recent.slice(0, -1).reduce((s, c) => s + c.volume, 0) / (recent.length - 1);
      const latestVol = latest.volume;
      if (latestVol > avgVol * 2) {
        alerts.push({
          id: `vol-${latest.time}`,
          icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
          title: `Volume Spike: ${info.symbol}`,
          description: `${(latestVol / 1000).toFixed(0)}K vs avg ${(avgVol / 1000).toFixed(0)}K (${((latestVol / avgVol - 1) * 100).toFixed(0)}% above)`,
          timestamp: new Date(latest.time * 1000),
          severity: latestVol > avgVol * 3 ? 'critical' : 'warning',
          read: false,
        });
      }
    }

    // EIA report reminder
    const now = new Date();
    const day = now.getDay();
    if (day === 3) {
      const hoursUntil = 10.5 - now.getHours() - now.getMinutes() / 60;
      if (hoursUntil > 0 && hoursUntil < 3) {
        alerts.push({
          id: `eia-reminder-${now.getDate()}`,
          icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
          title: 'EIA Report Coming Up',
          description: `Weekly inventory report in ${Math.floor(hoursUntil)}h ${Math.floor((hoursUntil % 1) * 60)}m. Expect increased volatility.`,
          timestamp: now,
          severity: hoursUntil < 1 ? 'critical' : 'warning',
          read: false,
        });
      }
    }

    // Check recent EIA candles
    const eiaCandles = candles.filter(c => {
      const d = new Date(c.time * 1000);
      return d.getDay() === 3;
    });
    if (eiaCandles.length > 0) {
      const lastEIA = eiaCandles[eiaCandles.length - 1];
      const eiaDate = new Date(lastEIA.time * 1000);
      const daysSince = Math.floor((Date.now() - eiaDate.getTime()) / 86400000);
      if (daysSince <= 1 && lastEIA.eiaExpectation) {
        alerts.push({
          id: `eia-result-${lastEIA.time}`,
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          title: `EIA Report: ${lastEIA.eiaExpectation.toUpperCase()}`,
          description: `${info.symbol} inventory ${lastEIA.eiaExpectation === 'draw' ? 'draw' : 'build'} reported. ${lastEIA.eiaExpectation === 'draw' ? 'Bullish signal' : 'Bearish signal'}.`,
          timestamp: new Date(lastEIA.time * 1000),
          severity: 'warning',
          read: false,
        });
      }
    }

    // Weather alerts
    const highWeatherCandles = recent.filter(c => Math.abs(c.weatherImpact || 0) > 60);
    if (highWeatherCandles.length > 0) {
      const worst = highWeatherCandles.reduce((a, b) =>
        Math.abs(a.weatherImpact || 0) > Math.abs(b.weatherImpact || 0) ? a : b
      );
      const impact = worst.weatherImpact || 0;
      alerts.push({
        id: `weather-${worst.time}`,
        icon: <Thermometer className="w-3.5 h-3.5 text-orange-400" />,
        title: `Weather Alert: ${info.symbol}`,
        description: `Impact score ${impact > 0 ? '+' : ''}${impact.toFixed(0)} — ${Math.abs(impact) > 75 ? 'Severe weather disruption expected' : 'Significant weather influence detected'}`,
        timestamp: new Date(worst.time * 1000),
        severity: Math.abs(impact) > 75 ? 'critical' : 'warning',
        read: false,
      });
    }

    return alerts;
  }, [candles, symbol]);

  // Merge generated alerts with read/dismissed state
  const notifications = useMemo(() => {
    return generatedAlerts
      .filter((a) => !dismissedIds.has(a.id))
      .map((a) => ({
        ...a,
        read: readIds.has(a.id),
      }))
      .slice(0, 20);
  }, [generatedAlerts, readIds, dismissedIds]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const clearAll = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  }, [notifications]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0 rounded-md border border-white/[0.06] bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10 hover:border-amber-500/20 transition-all duration-200"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white px-0.5 leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[340px] bg-gray-950/95 backdrop-blur-xl border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-0"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllRead();
              }}
              className="flex items-center gap-1 text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>

        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <Bell className="w-6 h-6 mb-2 opacity-30" />
              <span className="text-xs">No notifications</span>
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {notifications.map((notif) => {
                const colors = severityColors(notif.severity);
                return (
                  <div
                    key={notif.id}
                    className={`group relative flex gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200 ${colors.bg} border ${colors.border} ${!notif.read ? 'ring-1 ring-inset ring-amber-500/10' : ''}`}
                  >
                    {/* Unread indicator */}
                    {!notif.read && (
                      <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5 ml-1">
                      {notif.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-[11px] font-semibold leading-tight ${notif.read ? 'text-gray-400' : 'text-gray-200'}`}>
                          {notif.title}
                        </span>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-600">{timeAgo(notif.timestamp)}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${colors.text}`}>
                          {notif.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-white/[0.06] px-4 py-2">
            <button
              onClick={clearAll}
              className="w-full text-center text-[10px] text-gray-600 hover:text-gray-400 transition-colors py-1"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
