import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketDataService } from '../../../infrastructure/database/market-data.service';
import { TradingSignalService } from '../../../infrastructure/database/trading-signal.service';
import { TechnicalIndicatorsService } from '../../../common/indicators/technical-indicators.service';
import { IMarketDataPoint, ITradingSignal } from '../../../common/interfaces/trading.interface';

export interface MarketScenario {
  id: number;
  name: string;
  description: string;
  conditions: {
    buySignalRatio?: { min?: number; max?: number };
    sellSignalRatio?: { min?: number; max?: number };
    rsiBelow50Ratio?: { min?: number };
    rsiAbove50Ratio?: { min?: number };
    psarUpRatio?: { min?: number };
    psarDownRatio?: { min?: number };
    volumeIncreasePercent?: { min?: number; max?: number };
    bullishEngulfingRatio?: { min?: number };
    bearishEngulfingRatio?: { min?: number };
    totalSignalRatio?: { min?: number };
    volumeAnomalyRatio?: { min?: number };
    engulfingPatternRatio?: { min?: number; max?: number };
    rsiExtremeRatio?: { min?: number };
    riskWarningRatio?: { min?: number };
    rsiRecovery?: boolean;
    psarReversalRatio?: { min?: number };
    volumePositiveGrowth?: boolean;
  };
  evaluation: string;
  recommendation: string;
  note?: string;
  alertLevel: 'info' | 'warning' | 'critical';
}

export interface MarketOverview {
  scenario: MarketScenario;
  timestamp: Date;
  metrics: {
    totalTickers: number;
    buySignals: number;
    sellSignals: number;
    riskWarnings: number;
    buySignalRatio: number;
    sellSignalRatio: number;
    riskWarningRatio: number;
    rsiBelow50Ratio: number;
    rsiAbove50Ratio: number;
    psarUpRatio: number;
    psarDownRatio: number;
    volumeIncreasePercent: number;
    bullishEngulfingRatio: number;
    bearishEngulfingRatio: number;
    totalSignalRatio: number;
    volumeAnomalyRatio: number;
    engulfingPatternRatio: number;
    rsiExtremeRatio: number;
    rsiRecovery: boolean;
    psarReversalRatio: number;
    volumePositiveGrowth: boolean;
    averageRSI: number;
    averageVolume: number;
    previousAverageVolume: number;
  };
  tickers: {
    buy: string[];
    sell: string[];
    risk: string[];
    highVolume: string[];
    rsiExtreme: string[];
  };
}

@Injectable()
export class MarketAnalysisService {
  private readonly logger = new Logger(MarketAnalysisService.name);
  private readonly scenarios: MarketScenario[] = [
    {
      id: 1,
      name: 'THỊ TRƯỜNG TĂNG MẠNH (BULLISH MARKET)',
      description: 'Thị trường đang trong xu hướng tăng mạnh với nhiều cơ hội đầu tư',
      conditions: {
        buySignalRatio: { min: 0.6 },
        rsiBelow50Ratio: { min: 0.7 },
        psarUpRatio: { min: 0.65 },
        volumeIncreasePercent: { min: 20 },
        bullishEngulfingRatio: { min: 0.4 },
      },
      evaluation: 'Thị trường đang trong xu hướng tăng mạnh với nhiều cơ hội đầu tư.',
      recommendation: 'Tích cực tìm kiếm cơ hội mua vào.',
      note: 'Quản lý rủi ro thận trọng do wave tăng mạnh.',
      alertLevel: 'info',
    },
    {
      id: 2,
      name: 'THỊ TRƯỜNG GIẢM MẠNH (BEARISH MARKET)',
      description: 'Thị trường đang trong xu hướng giảm mạnh với áp lực bán lớn',
      conditions: {
        sellSignalRatio: { min: 0.5 },
        rsiAbove50Ratio: { min: 0.7 },
        psarDownRatio: { min: 0.6 },
        volumeIncreasePercent: { min: 15 },
        bearishEngulfingRatio: { min: 0.35 },
      },
      evaluation: 'Thị trường đang trong xu hướng giảm mạnh với áp lực bán lớn.',
      recommendation: 'Thận trọng, ưu tiên bảo toàn vốn.',
      note: 'Có thể xuất hiện cơ hội đảo chiều ở các mức hỗ trợ.',
      alertLevel: 'warning',
    },
    {
      id: 3,
      name: 'THỊ TRƯỜNG SIDEWAY (NEUTRAL MARKET)',
      description: 'Thị trường đang consolidate, chưa có xu hướng rõ ràng',
      conditions: {
        buySignalRatio: { min: 0.3, max: 0.5 },
        sellSignalRatio: { min: 0.3, max: 0.5 },
        volumeIncreasePercent: { max: 10 },
        engulfingPatternRatio: { max: 0.3 },
      },
      evaluation: 'Thị trường đang consolidate, chưa có xu hướng rõ ràng.',
      recommendation: 'Chọn lọc từng cổ phiếu cụ thể.',
      alertLevel: 'info',
    },
    {
      id: 4,
      name: 'THỊ TRƯỜNG BIẾN ĐỘNG CAO (HIGH VOLATILITY)',
      description: 'Thị trường đang có biến động rất cao',
      conditions: {
        totalSignalRatio: { min: 0.8 },
        volumeAnomalyRatio: { min: 0.7 },
        engulfingPatternRatio: { min: 0.6 },
        rsiExtremeRatio: { min: 0.5 },
      },
      evaluation: 'Thị trường đang có biến động rất cao!',
      recommendation: 'Quản lý rủi ro nghiêm ngặt, giảm kích thước lệnh.',
      note: 'Phù hợp với traders kinh nghiệm, scalping.',
      alertLevel: 'critical',
    },
    {
      id: 5,
      name: 'THỊ TRƯỜNG PHỤC HỒI',
      description: 'Thị trường đang cho tín hiệu phục hồi tích cực',
      conditions: {
        buySignalRatio: { min: 0.45 },
        rsiRecovery: true,
        psarReversalRatio: { min: 0.4 },
        volumePositiveGrowth: true,
      },
      evaluation: 'Thị trường đang cho tín hiệu phục hồi tích cực!',
      recommendation: 'Cân nhắc gia tăng positions từ từ.',
      note: 'Xác nhận xu hướng bằng breakout các mức kháng cự.',
      alertLevel: 'info',
    },
    {
      id: 6,
      name: 'THỊ TRƯỜNG RỦI RO CAO (HIGH RISK ALERT)',
      description: 'Thị trường đang ở trạng thái rủi ro cao',
      conditions: {
        riskWarningRatio: { min: 0.4 },
        rsiExtremeRatio: { min: 0.5 },
        volumeAnomalyRatio: { min: 0.6 },
        engulfingPatternRatio: { min: 0.4 },
      },
      evaluation: 'Thị trường đang ở trạng thái rủi ro cao!',
      recommendation: 'DỪNG giao dịch mới, review portfolio.',
      note: 'Cắt lỗ các positions yếu, giữ cash.',
      alertLevel: 'critical',
    },
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataService,
    private readonly tradingSignalService: TradingSignalService,
    private readonly indicatorsService: TechnicalIndicatorsService,
  ) {}

  /**
   * Analyze market conditions and determine scenario
   */
  async analyzeMarketConditions(tickers: string[]): Promise<MarketOverview> {
    try {
      this.logger.log(`Analyzing market conditions for ${tickers.length} tickers`);

      // Get latest data for all tickers across all timeframes
      const timeframes = ['15m', '1h', '4h', '1d'];
      const allMarketData: { [ticker: string]: IMarketDataPoint[] } = {};
      const allSignals: ITradingSignal[] = [];

      // Collect data from all timeframes
      for (const timeframe of timeframes) {
        const latestData = await this.marketDataService.getLatestDataForTickers(tickers, timeframe);
        
        for (const [ticker, data] of latestData) {
          if (!allMarketData[ticker]) {
            allMarketData[ticker] = [];
          }
          allMarketData[ticker].push(data);
        }

        // Get recent signals for this timeframe (today only)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const recentSignals = await this.tradingSignalService.findMany({
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
          limit: 1000
        });
        allSignals.push(...recentSignals.signals.filter(s => tickers.includes(s.ticker)).map(s => s as ITradingSignal));
      }

      // Calculate metrics
      const metrics = await this.calculateMarketMetrics(tickers, allMarketData, allSignals);
      
      // Determine scenario
      const scenario = this.determineMarketScenario(metrics);
      
      // Categorize tickers
      const tickerCategories = this.categorizeTickers(tickers, allMarketData, allSignals, metrics);

      const overview: MarketOverview = {
        scenario,
        timestamp: new Date(),
        metrics,
        tickers: tickerCategories,
      };

      this.logger.log(`Market analysis completed: ${scenario.name}`);
      return overview;

    } catch (error) {
      this.logger.error('Failed to analyze market conditions:', error);
      throw error;
    }
  }

  /**
   * Calculate market metrics
   */
  private async calculateMarketMetrics(
    tickers: string[],
    marketData: { [ticker: string]: IMarketDataPoint[] },
    signals: ITradingSignal[]
  ) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Filter recent signals (last 24 hours)
    const recentSignals = signals.filter(s => s.timestamp >= oneDayAgo);
    
    // Count signals by type
    const buySignals = recentSignals.filter(s => s.signalType === 'buy');
    const sellSignals = recentSignals.filter(s => s.signalType === 'sell');
    const riskWarnings = recentSignals.filter(s => s.signalType === 'risk_warning');

    const totalSignals = buySignals.length + sellSignals.length + riskWarnings.length;
    const buySignalRatio = totalSignals > 0 ? buySignals.length / totalSignals : 0;
    const sellSignalRatio = totalSignals > 0 ? sellSignals.length / totalSignals : 0;
    const riskWarningRatio = totalSignals > 0 ? riskWarnings.length / totalSignals : 0;

    // Calculate RSI and PSAR ratios
    let rsiBelow50Count = 0;
    let rsiAbove50Count = 0;
    let psarUpCount = 0;
    let psarDownCount = 0;
    let rsiExtremeCount = 0;
    let volumeAnomalyCount = 0;
    let bullishEngulfingCount = 0;
    let bearishEngulfingCount = 0;
    let totalRSI = 0;
    let rsiCount = 0;
    let totalVolume = 0;
    let volumeCount = 0;

    for (const ticker of tickers) {
      const tickerData = marketData[ticker];
      if (!tickerData || tickerData.length === 0) continue;

      // Use 4h data for analysis (most reliable)
      const data4h = tickerData.find(d => d.timeframe === '4h');
      if (!data4h) continue;

      // RSI analysis
      if (data4h.rsi !== undefined) {
        totalRSI += data4h.rsi;
        rsiCount++;
        
        if (data4h.rsi < 50) rsiBelow50Count++;
        if (data4h.rsi > 50) rsiAbove50Count++;
        if (data4h.rsi < 25 || data4h.rsi > 75) rsiExtremeCount++;
      }

      // PSAR analysis
      if (data4h.psarTrend) {
        if (data4h.psarTrend === 'up') psarUpCount++;
        if (data4h.psarTrend === 'down') psarDownCount++;
      }

      // Volume analysis
      if (data4h.volume !== undefined) {
        totalVolume += data4h.volume;
        volumeCount++;
      }

      // Volume anomaly
      if (data4h.volumeAnomaly) volumeAnomalyCount++;

      // Engulfing patterns
      if (data4h.engulfingPattern !== undefined) {
        if (data4h.engulfingPattern === 1) bullishEngulfingCount++;
        if (data4h.engulfingPattern === -1) bearishEngulfingCount++;
      }
    }

    const validTickers = rsiCount;
    const rsiBelow50Ratio = validTickers > 0 ? rsiBelow50Count / validTickers : 0;
    const rsiAbove50Ratio = validTickers > 0 ? rsiAbove50Count / validTickers : 0;
    const psarUpRatio = validTickers > 0 ? psarUpCount / validTickers : 0;
    const psarDownRatio = validTickers > 0 ? psarDownCount / validTickers : 0;
    const rsiExtremeRatio = validTickers > 0 ? rsiExtremeCount / validTickers : 0;
    const volumeAnomalyRatio = validTickers > 0 ? volumeAnomalyCount / validTickers : 0;
    const bullishEngulfingRatio = validTickers > 0 ? bullishEngulfingCount / validTickers : 0;
    const bearishEngulfingRatio = validTickers > 0 ? bearishEngulfingCount / validTickers : 0;
    const engulfingPatternRatio = bullishEngulfingRatio + bearishEngulfingRatio;

    const averageRSI = rsiCount > 0 ? totalRSI / rsiCount : 50;
    const averageVolume = volumeCount > 0 ? totalVolume / volumeCount : 0;

    // Calculate volume change (simplified - would need historical data for accurate calculation)
    const previousAverageVolume = averageVolume * 0.9; // Placeholder
    const volumeIncreasePercent = previousAverageVolume > 0 
      ? ((averageVolume - previousAverageVolume) / previousAverageVolume) * 100 
      : 0;

    // Calculate ratios
    const totalSignalRatio = tickers.length > 0 ? totalSignals / tickers.length : 0;

    // RSI recovery analysis (simplified)
    const rsiRecovery = averageRSI > 30 && averageRSI < 50;

    // PSAR reversal analysis (simplified)
    const psarReversalRatio = psarUpRatio; // Placeholder

    // Volume positive growth (simplified)
    const volumePositiveGrowth = volumeIncreasePercent > 0;

    return {
      totalTickers: tickers.length,
      buySignals: buySignals.length,
      sellSignals: sellSignals.length,
      riskWarnings: riskWarnings.length,
      buySignalRatio,
      sellSignalRatio,
      riskWarningRatio,
      rsiBelow50Ratio,
      rsiAbove50Ratio,
      psarUpRatio,
      psarDownRatio,
      volumeIncreasePercent,
      bullishEngulfingRatio,
      bearishEngulfingRatio,
      totalSignalRatio,
      volumeAnomalyRatio,
      engulfingPatternRatio,
      rsiExtremeRatio,
      rsiRecovery,
      psarReversalRatio,
      volumePositiveGrowth,
      averageRSI,
      averageVolume,
      previousAverageVolume,
    };
  }

  /**
   * Determine market scenario based on metrics
   */
  private determineMarketScenario(metrics: any): MarketScenario {
    for (const scenario of this.scenarios) {
      if (this.checkScenarioConditions(scenario, metrics)) {
        return scenario;
      }
    }

    // Default to neutral if no scenario matches
    return this.scenarios[2]; // Neutral market
  }

  /**
   * Check if scenario conditions are met
   */
  private checkScenarioConditions(scenario: MarketScenario, metrics: any): boolean {
    const conditions = scenario.conditions;

    // Check each condition
    if (conditions.buySignalRatio) {
      if (conditions.buySignalRatio.min && metrics.buySignalRatio < conditions.buySignalRatio.min) return false;
      if (conditions.buySignalRatio.max && metrics.buySignalRatio > conditions.buySignalRatio.max) return false;
    }

    if (conditions.sellSignalRatio) {
      if (conditions.sellSignalRatio.min && metrics.sellSignalRatio < conditions.sellSignalRatio.min) return false;
      if (conditions.sellSignalRatio.max && metrics.sellSignalRatio > conditions.sellSignalRatio.max) return false;
    }

    if (conditions.rsiBelow50Ratio?.min && metrics.rsiBelow50Ratio < conditions.rsiBelow50Ratio.min) return false;
    if (conditions.rsiAbove50Ratio?.min && metrics.rsiAbove50Ratio < conditions.rsiAbove50Ratio.min) return false;
    if (conditions.psarUpRatio?.min && metrics.psarUpRatio < conditions.psarUpRatio.min) return false;
    if (conditions.psarDownRatio?.min && metrics.psarDownRatio < conditions.psarDownRatio.min) return false;
    if (conditions.volumeIncreasePercent) {
      if (conditions.volumeIncreasePercent.min && metrics.volumeIncreasePercent < conditions.volumeIncreasePercent.min) return false;
      if (conditions.volumeIncreasePercent.max && metrics.volumeIncreasePercent > conditions.volumeIncreasePercent.max) return false;
    }
    if (conditions.bullishEngulfingRatio?.min && metrics.bullishEngulfingRatio < conditions.bullishEngulfingRatio.min) return false;
    if (conditions.bearishEngulfingRatio?.min && metrics.bearishEngulfingRatio < conditions.bearishEngulfingRatio.min) return false;
    if (conditions.totalSignalRatio?.min && metrics.totalSignalRatio < conditions.totalSignalRatio.min) return false;
    if (conditions.volumeAnomalyRatio?.min && metrics.volumeAnomalyRatio < conditions.volumeAnomalyRatio.min) return false;
    if (conditions.engulfingPatternRatio) {
      if (conditions.engulfingPatternRatio.min && metrics.engulfingPatternRatio < conditions.engulfingPatternRatio.min) return false;
      if (conditions.engulfingPatternRatio.max && metrics.engulfingPatternRatio > conditions.engulfingPatternRatio.max) return false;
    }
    if (conditions.rsiExtremeRatio?.min && metrics.rsiExtremeRatio < conditions.rsiExtremeRatio.min) return false;
    if (conditions.riskWarningRatio?.min && metrics.riskWarningRatio < conditions.riskWarningRatio.min) return false;
    if (conditions.rsiRecovery !== undefined && metrics.rsiRecovery !== conditions.rsiRecovery) return false;
    if (conditions.psarReversalRatio?.min && metrics.psarReversalRatio < conditions.psarReversalRatio.min) return false;
    if (conditions.volumePositiveGrowth !== undefined && metrics.volumePositiveGrowth !== conditions.volumePositiveGrowth) return false;

    return true;
  }

  /**
   * Categorize tickers based on signals and metrics
   */
  private categorizeTickers(
    tickers: string[],
    marketData: { [ticker: string]: IMarketDataPoint[] },
    signals: ITradingSignal[],
    metrics: any
  ) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentSignals = signals.filter(s => s.timestamp >= oneDayAgo);

    const buyTickers = new Set<string>();
    const sellTickers = new Set<string>();
    const riskTickers = new Set<string>();
    const highVolumeTickers = new Set<string>();
    const rsiExtremeTickers = new Set<string>();

    for (const ticker of tickers) {
      const tickerSignals = recentSignals.filter(s => s.ticker === ticker);
      const tickerData = marketData[ticker];
      const data4h = tickerData?.find(d => d.timeframe === '4h');

      // Categorize by signal type
      if (tickerSignals.some(s => s.signalType === 'buy')) buyTickers.add(ticker);
      if (tickerSignals.some(s => s.signalType === 'sell')) sellTickers.add(ticker);
      if (tickerSignals.some(s => s.signalType === 'risk_warning')) riskTickers.add(ticker);

      // Categorize by technical indicators
      if (data4h) {
        if (data4h.volumeAnomaly) highVolumeTickers.add(ticker);
        if (data4h.rsi !== undefined && (data4h.rsi < 25 || data4h.rsi > 75)) {
          rsiExtremeTickers.add(ticker);
        }
      }
    }

    return {
      buy: Array.from(buyTickers),
      sell: Array.from(sellTickers),
      risk: Array.from(riskTickers),
      highVolume: Array.from(highVolumeTickers),
      rsiExtreme: Array.from(rsiExtremeTickers),
    };
  }

  /**
   * Get strategy introduction content
   */
  getStrategyIntroduction(): string {
    return `
📊 **GIỚI THIỆU VỀ CHIẾN LƯỢC RSI-PSAR-ENGULFING**

**🎯 Mục tiêu:** Tối ưu hóa lợi nhuận thông qua phân tích kỹ thuật đa chỉ báo

**🔧 Các chỉ báo chính:**
• **RSI (Relative Strength Index):** Đo lường momentum, phát hiện vùng quá mua/quá bán
• **PSAR (Parabolic SAR):** Xác định xu hướng chính và điểm đảo chiều
• **Engulfing Pattern:** Mô hình nến đảo chiều mạnh mẽ
• **Volume Analysis:** Phát hiện volume bất thường

**⚡ Tín hiệu mua:**
- RSI < 30 (oversold) + PSAR uptrend + Price > PSAR
- Bullish Engulfing + Volume spike
- RSI phục hồi từ vùng oversold

**📉 Tín hiệu bán:**
- RSI > 70 (overbought) + PSAR downtrend
- Bearish Engulfing + Volume tăng
- Price < PSAR (trend reversal)

**⚠️ Cảnh báo rủi ro:**
- RSI extreme (< 20 hoặc > 80)
- Volume anomaly cao
- Gap up/down mạnh
- Biến động giá nhanh

**🛡️ Quản lý rủi ro:**
- Stop loss: 8% mặc định
- Take profit: 15% mặc định
- Tối đa 10 positions đồng thời
- Giới hạn loss hàng ngày: 5%
    `;
  }

  /**
   * Get market overview content
   */
  getMarketOverviewContent(overview: MarketOverview): string {
    const { scenario, metrics, tickers } = overview;
    
    return `
📈 **TỔNG QUAN THỊ TRƯỜNG - ${scenario.name}**

**📊 Thống kê tổng quan:**
• Tổng số mã: ${metrics.totalTickers}
• Tín hiệu mua: ${metrics.buySignals} (${(metrics.buySignalRatio * 100).toFixed(1)}%)
• Tín hiệu bán: ${metrics.sellSignals} (${(metrics.sellSignalRatio * 100).toFixed(1)}%)
• Cảnh báo rủi ro: ${metrics.riskWarnings} (${(metrics.riskWarningRatio * 100).toFixed(1)}%)

**📈 Chỉ số kỹ thuật:**
• RSI trung bình: ${metrics.averageRSI.toFixed(1)}
• RSI < 50: ${(metrics.rsiBelow50Ratio * 100).toFixed(1)}% mã
• PSAR Uptrend: ${(metrics.psarUpRatio * 100).toFixed(1)}% mã
• Volume tăng: ${metrics.volumeIncreasePercent.toFixed(1)}%

**🎯 Đánh giá:**
${scenario.evaluation}

**💡 Khuyến nghị:**
${scenario.recommendation}

${scenario.note ? `**⚠️ Lưu ý:** ${scenario.note}` : ''}

**📋 Mã nổi bật:**
• Mua: ${tickers.buy.slice(0, 5).join(', ')}${tickers.buy.length > 5 ? '...' : ''}
• Bán: ${tickers.sell.slice(0, 5).join(', ')}${tickers.sell.length > 5 ? '...' : ''}
• Rủi ro: ${tickers.risk.slice(0, 5).join(', ')}${tickers.risk.length > 5 ? '...' : ''}
    `;
  }
}
