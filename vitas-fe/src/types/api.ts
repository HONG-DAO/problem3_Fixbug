// Base API Response
export interface BaseResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Market Data Types
export interface MarketDataPoint {
  _id?: string;
  ticker: string;
  timestamp: string;
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

export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Trading Signal Types
export interface TradingSignal {
  _id?: string;
  ticker: string;
  timestamp: string;
  signalType: 'buy' | 'sell' | 'risk_warning';
  confidence: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  metadata?: Record<string, unknown>;
  timeframe?: string;
  indicators?: {
    rsi?: number;
    psar?: number;
    psarTrend?: string;
    engulfingPattern?: number;
    volumeAnomaly?: boolean;
    priceVsPsar?: boolean;
  };
}

// Market Analysis Types
export interface MarketScenario {
  _id?: string;
  name: string;
  type: 'BULLISH_MARKET' | 'BEARISH_MARKET' | 'SIDEWAY_MARKET' | 'HIGH_VOLATILITY' | 'RECOVERY_MARKET' | 'HIGH_RISK_ALERT';
  description: string;
  conditions: {
    buySignalRatio: { min: number; max: number };
    sellSignalRatio: { min: number; max: number };
    rsiBelow50Ratio: { min: number; max: number };
    psarUptrendRatio: { min: number; max: number };
    volumeChange: { min: number; max: number };
    engulfingRatio: { min: number; max: number };
  };
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketMetrics {
  totalTickers: number;
  activeSignals: number;
  buySignals: number;
  sellSignals: number;
  riskWarnings: number;
  avgConfidence: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  signalRatios: {
    buyRatio: number;
    sellRatio: number;
    riskRatio: number;
  };
  technicalIndicators: {
    avgRSI: number;
    rsiBelow50Ratio: number;
    psarUptrendRatio: number;
    volumeIncreaseRatio: number;
    bullishEngulfingRatio: number;
    bearishEngulfingRatio: number;
  };
}

export interface TimeframeAnalysis {
  [timeframe: string]: {
    totalSignals: number;
    buyRatio: number;
    sellRatio: number;
    avgVolume: number;
    avgRSI: number;
    volumeAnomaly: number;
  };
}

export interface MarketOverview {
  _id?: string;
  timestamp: string;
  scenario: MarketScenario;
  metrics: MarketMetrics;
  timeframeAnalysis: TimeframeAnalysis;
  analysisData: {
    totalTickers: number;
    analyzedTickers: number;
    signalCounts: {
      buy: number;
      sell: number;
      risk: number;
    };
    averageMetrics: {
      rsi: number;
      confidence: number;
      volume: number;
    };
  };
  recommendations: string[];
  riskAlerts: string[];
  lastUpdated: string;
}

// User Watchlist Types
export interface WatchlistItem {
  ticker: string;
  preferences?: {
    minConfidence?: number;
    signalTypes?: ('buy' | 'sell' | 'risk_warning')[];
    timeframes?: string[];
  };
  addedAt: string;
}

export interface UserWatchlist {
  _id?: string;
  userId: string;
  name: string;
  tickers: WatchlistItem[];
  notificationChannels: ('telegram' | 'dashboard' | 'email')[];
  isActive: boolean;
  totalTickers: number;
  createdAt?: string;
  updatedAt?: string;
}

// Dashboard specific types
export interface DashboardData {
  marketOverview: MarketOverview;
  signals: TradingSignal[];
  signalsByTicker: Record<string, TradingSignal[]>;
  watchlist: string[];
  totalSignals: number;
  tickersWithSignals: number;
}

export interface ChartDataResponse {
  ticker: string;
  timeframe: string;
  data: OHLCVData[];
  count: number;
}

// Portfolio Types
export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  weight: number;
  lastUpdate: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
}

// API Query Types
export interface MarketDataQuery {
  ticker?: string;
  tickers?: string[];
  timeframe?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TradingSignalsQuery {
  ticker?: string;
  signalType?: 'buy' | 'sell' | 'risk_warning';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  minConfidence?: number;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

// Notification Types
export interface NotificationSettings {
  telegram: {
    enabled: boolean;
    buySignals: boolean;
    sellSignals: boolean;
    riskWarnings: boolean;
    dailySummary: boolean;
  };
  email: {
    enabled: boolean;
    buySignals: boolean;
    sellSignals: boolean;
    riskWarnings: boolean;
    dailySummary: boolean;
  };
  dashboard: {
    enabled: boolean;
    realTimeUpdates: boolean;
    soundAlerts: boolean;
  };
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}
