import { IBaseEntity } from './base.interface';

export interface ITradingSignal extends IBaseEntity {
  ticker: string;
  timestamp: Date;
  signalType: 'buy' | 'sell' | 'risk_warning';
  confidence: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  metadata?: Record<string, any>;
  timeframe?: string;
  indicators?: ITechnicalIndicators;
}

export interface IMarketDataPoint extends IBaseEntity {
  ticker: string;
  timestamp: Date;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change?: number;
  changePercent?: number;
  totalMatchValue?: number;
  foreignBuyVolume?: number;
  foreignSellVolume?: number;
  matchVolume?: number;
  
  // Technical Indicators
  rsi?: number;
  psar?: number;
  psarTrend?: string;
  engulfingPattern?: number;
  volumeAnomaly?: boolean;
  priceVsPsar?: boolean;
  avgVolume20?: number;
}

export interface IStrategyState {
  ticker: string;
  lastUpdate: Date;
  currentPrice: number;
  positionStatus: 'none' | 'long' | 'short';
  entryPrice?: number;
  entryDate?: Date;
  unrealizedPnl: number;
  maxPriceSinceEntry: number;
  trailingStopPrice?: number;
  lastSignalType?: string;
  lastSignalTime?: Date;
}

export interface IRiskMetrics {
  totalPortfolioValue: number;
  totalExposure: number;
  dailyPnl: number;
  dailyDrawdown: number;
  activePositionsCount: number;
  riskLimitUsage: number;
  maxPositionSize: number;
  diversificationScore: number;
}

export interface IIndicatorResult {
  values: number[];
  signals?: number[];
  metadata?: Record<string, any>;
}

export interface ITechnicalIndicators {
  rsi?: number;
  psar?: number;
  psarTrend?: string;
  engulfingPattern?: number;
  volumeAnomaly?: boolean;
  priceVsPsar?: boolean;
  avgVolume20?: number;
}

export interface ITrade extends IBaseEntity {
  ticker: string;
  entryDate: Date;
  exitDate?: Date;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  tradeType: 'long' | 'short';
  status: 'open' | 'closed' | 'cancelled';
  pnlAmount?: number;
  pnlPercent?: number;
  maxPriceReached?: number;
  minPriceReached?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  exitReason?: string;
  metadata?: Record<string, any>;
}

export interface IPortfolioPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  weight: number;
  lastUpdate: Date;
}