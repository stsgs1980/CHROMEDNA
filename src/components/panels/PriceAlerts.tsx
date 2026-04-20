'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, ArrowUp, ArrowDown, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketStore, PriceAlert } from '@/stores/marketStore';

function AlertCard({ alert, onDelete }: { alert: PriceAlert; onDelete: (id: string) => void }) {
  const symbol = useMarketStore((s) => s.symbol);
  const decDigits = symbol === 'CL' ? 2 : 4;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-md border transition-all ${
        alert.triggered
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
      }`}
    >
      {/* Direction icon */}
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
        alert.direction === 'above'
          ? 'bg-green-500/15 text-green-400'
          : 'bg-red-500/15 text-red-400'
      }`}>
        {alert.direction === 'above' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )}
      </div>

      {/* Price and direction */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tabular-nums text-white">
            {alert.price.toFixed(decDigits)}
          </span>
          <span className={`text-[8px] font-semibold uppercase tracking-wider ${
            alert.direction === 'above' ? 'text-green-400/70' : 'text-red-400/70'
          }`}>
            {alert.direction}
          </span>
        </div>
        {alert.triggered && (
          <span className="text-[8px] text-amber-400 font-medium">Triggered</span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(alert.id)}
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export function PriceAlerts() {
  const symbol = useMarketStore((s) => s.symbol);
  const candles = useMarketStore((s) => s.candles);
  const priceAlerts = useMarketStore((s) => s.priceAlerts);
  const addPriceAlert = useMarketStore((s) => s.addPriceAlert);
  const removePriceAlert = useMarketStore((s) => s.removePriceAlert);
  const clearTriggeredAlerts = useMarketStore((s) => s.clearTriggeredAlerts);

  const [showForm, setShowForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

  const currentPrice = useMemo(() => {
    if (candles.length === 0) return 0;
    return candles[candles.length - 1].close;
  }, [candles]);

  const decDigits = symbol === 'CL' ? 2 : 4;

  // Filter alerts for current symbol
  const symbolAlerts = useMemo(
    () => priceAlerts.filter((a) => a.symbol === symbol),
    [priceAlerts, symbol]
  );
  const activeAlerts = symbolAlerts.filter((a) => !a.triggered);
  const triggeredAlerts = symbolAlerts.filter((a) => a.triggered);

  const handleAddAlert = () => {
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) return;

    addPriceAlert({
      symbol,
      price,
      direction: alertDirection,
    });

    setAlertPrice('');
    setShowForm(false);
  };

  const handleQuickPrice = () => {
    if (currentPrice > 0) {
      setAlertPrice(currentPrice.toFixed(decDigits));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price Alerts</span>
        {activeAlerts.length > 0 && (
          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full ml-auto">
            {activeAlerts.length}
          </span>
        )}
      </div>

      {/* Set Alert button / form */}
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(true);
                if (currentPrice > 0) {
                  setAlertPrice(currentPrice.toFixed(decDigits));
                }
              }}
              className="w-full h-8 text-xs border border-dashed border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Set Alert
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/[0.02] rounded-lg border border-amber-500/15 p-3 space-y-2.5"
          >
            {/* Price input */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Alert Price</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder={currentPrice > 0 ? currentPrice.toFixed(decDigits) : '0.00'}
                  step={symbol === 'CL' ? '0.01' : '0.0001'}
                  className="flex-1 h-7 px-2 text-xs tabular-nums bg-white/[0.04] border border-white/[0.06] rounded text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickPrice}
                  className="h-7 px-2 text-[9px] text-gray-400 hover:text-amber-400 border border-white/[0.06] hover:border-amber-500/20"
                >
                  Now
                </Button>
              </div>
            </div>

            {/* Direction toggle */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setAlertDirection('above')}
                  className={`flex items-center justify-center gap-1.5 h-7 rounded text-[10px] font-medium transition-all ${
                    alertDirection === 'above'
                      ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                      : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300'
                  }`}
                >
                  <ArrowUp className="w-3 h-3" />
                  Above
                </button>
                <button
                  onClick={() => setAlertDirection('below')}
                  className={`flex items-center justify-center gap-1.5 h-7 rounded text-[10px] font-medium transition-all ${
                    alertDirection === 'below'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300'
                  }`}
                >
                  <ArrowDown className="w-3 h-3" />
                  Below
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddAlert}
                disabled={!alertPrice || parseFloat(alertPrice) <= 0}
                className="flex-1 h-7 text-[10px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 disabled:opacity-30 disabled:hover:bg-amber-500/10 transition-all"
              >
                <BellRing className="w-3 h-3 mr-1" />
                Add Alert
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setAlertPrice('');
                }}
                className="h-7 px-3 text-[10px] text-gray-500 hover:text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active alerts */}
      {symbolAlerts.length > 0 && (
        <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {activeAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onDelete={removePriceAlert} />
            ))}
            {triggeredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onDelete={removePriceAlert} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Clear triggered button */}
      {triggeredAlerts.length > 0 && (
        <button
          onClick={clearTriggeredAlerts}
          className="w-full mt-2 text-[9px] text-gray-600 hover:text-gray-400 transition-colors py-1 flex items-center justify-center gap-1"
        >
          <Trash2 className="w-2.5 h-2.5" />
          Clear triggered alerts
        </button>
      )}

      {/* No alerts placeholder */}
      {symbolAlerts.length === 0 && !showForm && (
        <div className="text-[10px] text-gray-600 text-center py-3 mt-1">
          No alerts for {symbol}
        </div>
      )}
    </div>
  );
}
