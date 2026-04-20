// Energy futures contract types
export type EnergySymbol = 'CL' | 'NG' | 'RB' | 'HO';

export interface EnergySymbolInfo {
  symbol: EnergySymbol;
  name: string;
  basePrice: number;
  volatility: number;
  tickSize: number;
  unit: string;
  buyerColor: string;
  sellerColor: string;
}

export const ENERGY_SYMBOLS: Record<EnergySymbol, EnergySymbolInfo> = {
  CL: { symbol: 'CL', name: 'Crude Oil Light Sweet', basePrice: 75, volatility: 0.025, tickSize: 0.01, unit: '$/bbl', buyerColor: '#FFD700', sellerColor: '#8B4513' },
  NG: { symbol: 'NG', name: 'Natural Gas', basePrice: 3.0, volatility: 0.045, tickSize: 0.001, unit: '$/MMBtu', buyerColor: '#00CED1', sellerColor: '#FF6347' },
  RB: { symbol: 'RB', name: 'RBOB Gasoline', basePrice: 2.5, volatility: 0.02, tickSize: 0.0001, unit: '$/gal', buyerColor: '#32CD32', sellerColor: '#FF4500' },
  HO: { symbol: 'HO', name: 'Heating Oil', basePrice: 2.3, volatility: 0.022, tickSize: 0.0001, unit: '$/gal', buyerColor: '#9370DB', sellerColor: '#DC143C' },
};

export type DecompositionLevel = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6';

export interface DecompositionInfo {
  level: DecompositionLevel;
  label: string;
  description: string;
  timeRange: string;
}

export const DECOMPOSITION_LEVELS: DecompositionInfo[] = [
  { level: 'D1', label: 'Year', description: 'Annual macro view', timeRange: '1Y' },
  { level: 'D2', label: 'Quarter', description: 'Quarterly trends', timeRange: '3M' },
  { level: 'D3', label: 'Month', description: 'Monthly patterns', timeRange: '1M' },
  { level: 'D4', label: 'Week', description: 'Weekly cycles', timeRange: '1W' },
  { level: 'D5', label: 'Day', description: 'Intraday structure', timeRange: '1D' },
  { level: 'D6', label: 'Tick', description: 'Tick-by-tick flow', timeRange: '1m' },
];

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D' | '1W' | '1M';

export type EIAExpectation = 'build' | 'draw' | 'neutral' | 'waiting';

export type TrendDirection = 'bull' | 'bear' | 'sideways';

export type SignalType = 'BULLISH' | 'NEUTRAL' | 'BEARISH';
