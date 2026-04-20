import { create } from 'zustand';
import { EnergySymbol } from '@/types/energy';

export type TradeSide = 'BUY' | 'SELL';
export type PositionSide = 'Long' | 'Short' | 'Flat';

export interface SimTrade {
  id: string;
  symbol: EnergySymbol;
  side: TradeSide;
  price: number;
  quantity: number;
  pnl: number;
  timestamp: number;
}

export interface SimPosition {
  side: PositionSide;
  entryPrice: number;
  quantity: number;
}

interface TradeState {
  // Position
  position: SimPosition;

  // Trade history
  tradeHistory: SimTrade[];

  // Account
  startingBalance: number;
  currentBalance: number;

  // Equity curve (last N trade balances)
  equityCurve: number[];

  // Actions
  openTrade: (side: TradeSide, price: number, quantity: number, symbol: EnergySymbol) => void;
  closePosition: (currentPrice: number) => void;
  resetAccount: () => void;
}

export const STARTING_BALANCE = 100000;
export const CONTRACT_MULTIPLIER = 1000; // Simulated contract multiplier for P&L

function calcUnrealizedPnl(position: SimPosition, currentPrice: number): number {
  if (position.side === 'Flat') return 0;
  const direction = position.side === 'Long' ? 1 : -1;
  return direction * (currentPrice - position.entryPrice) * position.quantity * CONTRACT_MULTIPLIER;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  position: { side: 'Flat', entryPrice: 0, quantity: 0 },

  tradeHistory: [],

  startingBalance: STARTING_BALANCE,
  currentBalance: STARTING_BALANCE,

  equityCurve: [STARTING_BALANCE],

  openTrade: (side, price, quantity, symbol) => {
    const state = get();
    const position = state.position;

    // If flat, open new position
    if (position.side === 'Flat') {
      set({
        position: {
          side: side === 'BUY' ? 'Long' : 'Short',
          entryPrice: price,
          quantity,
        },
      });
      return;
    }

    // If same direction, add to position (average entry price)
    const isSameDirection =
      (position.side === 'Long' && side === 'BUY') ||
      (position.side === 'Short' && side === 'SELL');

    if (isSameDirection) {
      const totalQty = position.quantity + quantity;
      const avgPrice = (position.entryPrice * position.quantity + price * quantity) / totalQty;
      set({
        position: {
          ...position,
          entryPrice: avgPrice,
          quantity: totalQty,
        },
      });
      return;
    }

    // Opposite direction: close position and realize P&L
    const pnl = calcUnrealizedPnl(position, price);
    const closeQty = Math.min(position.quantity, quantity);
    const realizedPnl = (pnl / position.quantity) * closeQty;

    const trade: SimTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      symbol,
      side: side,
      price,
      quantity: closeQty,
      pnl: realizedPnl,
      timestamp: Date.now(),
    };

    const newBalance = state.currentBalance + realizedPnl;
    const remainingQty = position.quantity - closeQty;

    let newPosition: SimPosition;
    if (remainingQty > 0) {
      // Partial close - keep rest of position
      newPosition = { ...position, quantity: remainingQty };
    } else if (quantity > closeQty) {
      // Reversed - open new position with excess quantity
      const excessQty = quantity - closeQty;
      newPosition = {
        side: side === 'BUY' ? 'Long' : 'Short',
        entryPrice: price,
        quantity: excessQty,
      };
    } else {
      newPosition = { side: 'Flat', entryPrice: 0, quantity: 0 };
    }

    const newEquityCurve = [...state.equityCurve, newBalance].slice(-10);

    set({
      position: newPosition,
      tradeHistory: [trade, ...state.tradeHistory].slice(0, 50),
      currentBalance: newBalance,
      equityCurve: newEquityCurve,
    });
  },

  closePosition: (currentPrice) => {
    const state = get();
    const position = state.position;

    if (position.side === 'Flat') return;

    const pnl = calcUnrealizedPnl(position, currentPrice);

    const trade: SimTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      symbol: '' as EnergySymbol, // Will be set from component
      side: position.side === 'Long' ? 'SELL' : 'BUY',
      price: currentPrice,
      quantity: position.quantity,
      pnl,
      timestamp: Date.now(),
    };

    const newBalance = state.currentBalance + pnl;
    const newEquityCurve = [...state.equityCurve, newBalance].slice(-10);

    set({
      position: { side: 'Flat', entryPrice: 0, quantity: 0 },
      tradeHistory: [trade, ...state.tradeHistory].slice(0, 50),
      currentBalance: newBalance,
      equityCurve: newEquityCurve,
    });
  },

  resetAccount: () => {
    set({
      position: { side: 'Flat', entryPrice: 0, quantity: 0 },
      tradeHistory: [],
      startingBalance: STARTING_BALANCE,
      currentBalance: STARTING_BALANCE,
      equityCurve: [STARTING_BALANCE],
    });
  },
}));

// Helper to compute derived values
export function getTradeStats(state: TradeState) {
  const trades = state.tradeHistory;
  const totalPnl = state.currentBalance - state.startingBalance;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const total = trades.length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  // Max drawdown
  let peak = state.startingBalance;
  let maxDrawdown = 0;
  let runningBalance = state.startingBalance;

  for (const trade of [...trades].reverse()) {
    runningBalance += trade.pnl;
    if (runningBalance > peak) peak = runningBalance;
    const dd = ((peak - runningBalance) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return { totalPnl, winRate, maxDrawdown, totalTrades: total };
}
