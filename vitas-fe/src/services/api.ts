import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  BaseResponse, 
  MarketDataPoint, 
  TradingSignal, 
  MarketOverview, 
  UserWatchlist, 
  PortfolioSummary,
  MarketDataQuery,
  TradingSignalsQuery,
  OHLCVData,
  ApiError,
  DashboardData,
  ChartDataResponse,
  WatchlistItem
} from '../types/api';
import { createLogger } from '../utils/logger';

class ApiService {
  private api: AxiosInstance;
  private log = createLogger('api');

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.api.interceptors.request.use(cfg => {
      (cfg as any).meta = { t0: performance.now() };
      this.log.info('req', { url: cfg.url, params: cfg.params });
      return cfg;
    });

    // Add response interceptor
    this.api.interceptors.response.use(
      res => {
        const t0 = (res.config as any).meta?.t0 ?? performance.now();
        const dt = performance.now() - t0;
        this.log.info('res', { url: res.config.url, status: res.status, ms: dt.toFixed(1) });
        return res;
      },
      err => {
        const cfg = err.config || {};
        const t0 = (cfg as any).meta?.t0 ?? performance.now();
        const dt = performance.now() - t0;
        this.log.error('res:error', { url: cfg.url, ms: dt.toFixed(1), message: err?.message });
        return Promise.reject(err);
      }
    );

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          status: error.response?.status,
          code: error.response?.data?.code,
          details: error.response?.data,
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Market Data APIs
  async getMarketData(query: MarketDataQuery = {}): Promise<BaseResponse<MarketDataPoint[]>> {
    const response = await this.api.get('/market-data/query', { params: query });
    return response.data;
  }

  async getHistoricalData(
    ticker: string, 
    timeframe: string = '1m', 
    limit: number = 100,
    fromDate?: string,
    toDate?: string
  ): Promise<BaseResponse<MarketDataPoint[]>> {
    const params: Record<string, unknown> = { timeframe, limit };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    
    const response = await this.api.get(`/market-data/query/historical/${ticker}`, { params });
    return response.data;
  }

  async getLatestData(ticker: string, timeframe: string = '1m'): Promise<BaseResponse<MarketDataPoint>> {
    const response = await this.api.get(`/market-data/query/latest/${ticker}`, { 
      params: { timeframe } 
    });
    return response.data;
  }

  async getOHLCVData(
    ticker: string, 
    timeframe: string = '1m', 
    limit: number = 100
  ): Promise<BaseResponse<OHLCVData[]>> {
    const response = await this.api.get(`/market-data/query/ohlcv/${ticker}`, {
      params: { timeframe, limit }
    });
    return response.data;
  }

  async getMarketStatistics(
    hours: number = 24, 
    timeframe: string = '1m'
  ): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.get('/market-data/query/statistics', {
      params: { hours, timeframe }
    });
    return response.data;
  }

  async getAllTickers(): Promise<BaseResponse<{ tickers: string[]; count: number }>> {
    const response = await this.api.get('/market-data/query/all-tickers');
    return response.data;
  }

  // Trading Signals APIs
  async getTradingSignals(query: TradingSignalsQuery = {}): Promise<BaseResponse<TradingSignal[]>> {
    const response = await this.api.get('/trading/signals', { params: query });
    return response.data;
  }

  async getRecentSignals(hours: number = 24, limit: number = 100): Promise<BaseResponse<TradingSignal[]>> {
    const response = await this.api.get('/trading/signals/recent', {
      params: { hours, limit }
    });
    return response.data;
  }

  async getSignalsByTicker(ticker: string, limit: number = 50): Promise<BaseResponse<TradingSignal[]>> {
    const response = await this.api.get(`/trading/signals/ticker/${ticker}`, {
      params: { limit }
    });
    return response.data;
  }

  async getSignalStatistics(hours: number = 24): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.get('/trading/signals/statistics', {
      params: { hours }
    });
    return response.data;
  }

  // Dashboard APIs
  async getDashboardOverview(tickers?: string): Promise<BaseResponse<MarketOverview>> {
    const response = await this.api.get('/dashboard/market-overview', { 
      params: tickers ? { tickers } : {} 
    });
    return response.data;
  }

  async getDashboardSignals(hours: number = 24): Promise<BaseResponse<DashboardData>> {
    const response = await this.api.get('/dashboard/signals', {
      params: { hours }
    });
    return response.data;
  }

  async getChartData(
    ticker: string,
    timeframe: string = '1m',
    limit: number = 100,
    fromDate?: string,
    toDate?: string
  ): Promise<BaseResponse<ChartDataResponse>> {
    const params: any = { timeframe, limit };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    
    const response = await this.api.get(`/dashboard/chart-data/${ticker}`, {
      params
    });
    return response.data;
  }

  async getDashboardMarketData(
    tickers: string,
    timeframe: string = '1m'
  ): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.get('/dashboard/market-data', {
      params: { tickers, timeframe }
    });
    return response.data;
  }

  // Watchlist Management APIs
  async getWatchlist(): Promise<BaseResponse<{ watchlist: UserWatchlist[]; count: number }>> {
    const response = await this.api.get('/dashboard/watchlist');
    return response.data;
  }

  async addToWatchlist(
    ticker: string,
    notificationChannels?: string[],
    preferences?: {
      minConfidence?: number;
      signalTypes?: ('buy' | 'sell' | 'risk_warning')[];
      timeframes?: string[];
    }
  ): Promise<BaseResponse<WatchlistItem>> {
    const response = await this.api.post('/dashboard/watchlist', {
      ticker,
      notificationChannels,
      preferences
    });
    return response.data;
  }

  async removeFromWatchlist(ticker: string): Promise<BaseResponse<{ success: boolean; ticker: string }>> {
    const response = await this.api.post('/dashboard/watchlist/remove', { ticker });
    return response.data;
  }

  async updateWatchlistPreferences(
    ticker: string,
    preferences: {
      minConfidence?: number;
      signalTypes?: ('buy' | 'sell' | 'risk_warning')[];
      timeframes?: string[];
    }
  ): Promise<BaseResponse<{ success: boolean; ticker: string }>> {
    const response = await this.api.post('/dashboard/watchlist/preferences', {
      ticker,
      preferences
    });
    return response.data;
  }


  // Market Analysis APIs
  async getMarketOverview(tickers?: string): Promise<BaseResponse<MarketOverview>> {
    return this.getDashboardOverview(tickers);
  }

  async getStrategyIntroduction(): Promise<BaseResponse<{ content: string }>> {
    const response = await this.api.get('/dashboard/strategy-introduction');
    return response.data;
  }

  async getMarketOverviewContent(tickers?: string): Promise<BaseResponse<{ content: string; overview: MarketOverview }>> {
    const response = await this.api.get('/dashboard/market-overview-content', {
      params: tickers ? { tickers } : {}
    });
    return response.data;
  }

  // Portfolio APIs
  async getPortfolioSummary(): Promise<BaseResponse<PortfolioSummary>> {
    const response = await this.api.get('/portfolio/summary');
    return response.data;
  }

  // Trading Analysis APIs
  async analyzeTicker(ticker: string, periods: number = 100): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.post('/trading/analysis/ticker', {
      ticker,
      periods
    });
    return response.data;
  }

  async analyzeBulkTickers(tickers: string[], periods: number = 100): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.post('/trading/analysis/bulk', {
      tickers,
      periods
    });
    return response.data;
  }

  // Risk Management APIs
  async calculatePositionSize(
    ticker: string,
    entryPrice: number,
    stopLossPrice: number,
    portfolioValue: number
  ): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.post('/trading/risk/position-size', {
      ticker,
      entryPrice,
      stopLossPrice,
      portfolioValue
    });
    return response.data;
  }

  async getRiskMetrics(portfolioValue: number): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.get('/trading/risk/metrics', {
      params: { portfolioValue }
    });
    return response.data;
  }

  // Data Fetch APIs
  async fetchHistoricalData(
    tickers: string[],
    timeframe: string = '1m',
    periods: number = 100,
    fromDate?: string,
    toDate?: string
  ): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.post('/market-data/fetch/historical', {
      tickers,
      timeframe,
      periods,
      fromDate,
      toDate
    });
    return response.data;
  }

  async fetchLatestData(tickers: string[], timeframe: string = '1m'): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.post('/market-data/fetch/latest', {
      tickers,
      timeframe
    });
    return response.data;
  }

  async fetchTradingDaysData(tickers: string[], timeframe: string = '1m'): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.post('/market-data/fetch/trading-days', {
      tickers,
      timeframe
    });
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<BaseResponse<Record<string, unknown>>> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Watchlist Management APIs (placeholder implementations)

  // Utility methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Fetch latest candles for real-time updates
   */
  async fetchLatestCandles(symbol: string, interval: '1m'): Promise<OHLCVData[]> {
    try {
      const response = await this.api.get(`/market-data/latest/${symbol}`, {
        params: { timeframe: interval }
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch latest candles:', error);
      return [];
    }
  }
}

export const apiService = new ApiService();
export default apiService;
