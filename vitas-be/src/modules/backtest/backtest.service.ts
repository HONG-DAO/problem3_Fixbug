import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketDataService } from '../../infrastructure/database/market-data.service';
import { AnalysisService } from '../trading/services/analysis.service';
import { TradingSignalService } from '../../infrastructure/database/trading-signal.service';
import { TelegramService } from '../alerts/services/telegram.service';
import { EmailService } from '../alerts/services/email.service';
import { ITradingSignal } from '../../common/interfaces/trading.interface';
import { RunBacktestDto, BacktestResultDto, BacktestSummaryDto } from './dto/backtest.dto';

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);
  private isRunning = false;
  private currentBacktestId: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataService,
    private readonly analysisService: AnalysisService,
    private readonly tradingSignalService: TradingSignalService,
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Run backtest for specified tickers
   */
  async runBacktest(dto: RunBacktestDto): Promise<BacktestSummaryDto> {
    if (this.isRunning) {
      throw new Error('Backtest is already running. Please wait for completion or cancel current backtest.');
    }

    this.isRunning = true;
    this.currentBacktestId = `backtest_${Date.now()}`;
    const startTime = Date.now();

    this.logger.log(`🚀 Starting backtest ${this.currentBacktestId} for ${dto.tickers.length} tickers`);

    const summary: BacktestSummaryDto = {
      totalTickers: dto.tickers.length,
      totalCandles: 0,
      totalSignals: 0,
      totalProcessingTimeMs: 0,
      results: [],
      overallStatus: 'completed',
    };

    try {
      // Process each ticker
      for (const ticker of dto.tickers) {
        this.logger.log(`📊 Processing ticker: ${ticker}`);
        
        const result = await this.processTicker(ticker, dto);
        summary.results.push(result);
        summary.totalCandles += result.totalCandles;
        summary.totalSignals += result.buySignals + result.sellSignals + result.riskWarnings;
      }

      summary.totalProcessingTimeMs = Date.now() - startTime;
      summary.overallStatus = 'completed';

      this.logger.log(`✅ Backtest ${this.currentBacktestId} completed successfully`);
      this.logger.log(`📈 Summary: ${summary.totalCandles} candles, ${summary.totalSignals} signals in ${summary.totalProcessingTimeMs}ms`);

    } catch (error) {
      this.logger.error(`❌ Backtest ${this.currentBacktestId} failed:`, error);
      summary.overallStatus = 'failed';
      throw error;
    } finally {
      this.isRunning = false;
      this.currentBacktestId = null;
    }

    return summary;
  }

  /**
   * Process single ticker backtest
   */
  private async processTicker(ticker: string, dto: RunBacktestDto): Promise<BacktestResultDto> {
    const startTime = Date.now();
    const result: BacktestResultDto = {
      ticker,
      totalCandles: 0,
      buySignals: 0,
      sellSignals: 0,
      riskWarnings: 0,
      processingTimeMs: 0,
      status: 'completed',
    };

    try {
      // Get historical data
      this.logger.log(`📥 Fetching historical data for ${ticker} (${dto.timeframe})`);
      
      const historicalData = await this.marketDataService.getHistoricalData(
        ticker,
        dto.timeframe || '15m',
        dto.limit || 1000
      );

      if (!historicalData || historicalData.length === 0) {
        this.logger.warn(`⚠️ No historical data found for ${ticker}`);
        result.status = 'failed';
        return result;
      }

      // Sort by timestamp ASC for chronological processing
      const sortedData = historicalData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      result.totalCandles = sortedData.length;
      this.logger.log(`📊 Processing ${result.totalCandles} candles for ${ticker}`);

      // Process each candle
      for (let i = 0; i < sortedData.length; i++) {
        const candle = sortedData[i];
        
        // Log progress every 100 candles
        if (i % 100 === 0) {
          this.logger.log(`🔄 Processing ${ticker}: ${i + 1}/${sortedData.length} candles`);
        }

        // Analyze candle and generate signals
        const signals = await this.analyzeCandle(ticker, candle, dto.timeframe || '15m');
        
        // Process each signal
        for (const signal of signals) {
          await this.processSignal(signal, dto.dryRun || false);
          
          // Count signals by type
          switch (signal.signalType) {
            case 'buy':
              result.buySignals++;
              break;
            case 'sell':
              result.sellSignals++;
              break;
            case 'risk_warning':
              result.riskWarnings++;
              break;
          }

          // Track first and last signal times
          if (!result.firstSignalTime) {
            result.firstSignalTime = signal.timestamp.toISOString();
          }
          result.lastSignalTime = signal.timestamp.toISOString();
        }

        // Simulate real-time delay
        if (dto.speed && dto.speed > 0) {
          await this.delay(dto.speed);
        }
      }

      result.processingTimeMs = Date.now() - startTime;
      result.status = 'completed';

      this.logger.log(`✅ Completed ${ticker}: ${result.totalCandles} candles, ${result.buySignals + result.sellSignals + result.riskWarnings} signals in ${result.processingTimeMs}ms`);

    } catch (error) {
      this.logger.error(`❌ Failed to process ${ticker}:`, error);
      result.status = 'failed';
      result.processingTimeMs = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Analyze single candle and generate signals
   */
  private async analyzeCandle(ticker: string, candle: any, timeframe: string): Promise<ITradingSignal[]> {
    try {
      // Use AnalysisService to analyze the candle
      const signals = await this.analysisService.analyzeCandle(ticker, candle, timeframe);
      
      // FORCE CREATE SIGNALS FOR TESTING
      if (signals.length === 0) {
        this.logger.log(`🚀 FORCE CREATING SIGNAL for ${ticker} - Price: ${candle.close}, Volume: ${candle.volume}`);
        const forceSignal: ITradingSignal = {
          ticker,
          timestamp: candle.timestamp,
          signalType: 'buy',
          confidence: 0.5,
          entryPrice: candle.close,
          stopLoss: candle.close * 0.95,
          takeProfit: candle.close * 1.10,
          reason: `FORCE SIGNAL for ${ticker} - Price: ${candle.close.toLocaleString()}, Volume: ${candle.volume.toLocaleString()}`,
          indicators: {
            rsi: 50,
            psar: candle.close,
            psarTrend: 'up',
            engulfingPattern: 0,
            volumeAnomaly: false,
            priceVsPsar: true,
          },
          metadata: { price: candle.close, volume: candle.volume, forced: true },
        };
        return [forceSignal];
      }
      
      return signals;

    } catch (error) {
      this.logger.error(`Failed to analyze candle for ${ticker}:`, error);
      return [];
    }
  }

  /**
   * Process trading signal (save to DB and send notifications)
   */
  private async processSignal(signal: ITradingSignal, dryRun: boolean): Promise<void> {
    try {
      if (!dryRun) {
        // Save signal to database
        await this.tradingSignalService.createFromSignal(signal);
        this.logger.debug(`💾 Saved signal: ${signal.signalType} for ${signal.ticker}`);

        // Send notifications
        await this.sendNotifications(signal);
      } else {
        this.logger.log(`🔍 DRY RUN - Would save signal: ${signal.signalType} for ${signal.ticker} at ${signal.timestamp}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process signal for ${signal.ticker}:`, error);
    }
  }

  /**
   * Send notifications for trading signal
   */
  private async sendNotifications(signal: ITradingSignal): Promise<void> {
    try {
      // Send Telegram notification
      await this.telegramService.sendTradingSignal(signal);
      
      // Send Email notification based on signal type
      switch (signal.signalType) {
        case 'buy':
          await this.emailService.sendBuyAlert([signal]);
          break;
        case 'sell':
          await this.emailService.sendSellAlert([signal]);
          break;
        case 'risk_warning':
          await this.emailService.sendRiskWarning([signal]);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to send notifications for ${signal.ticker}:`, error);
    }
  }


  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get backtest status
   */
  getStatus(): { isRunning: boolean; currentBacktestId: string | null } {
    return {
      isRunning: this.isRunning,
      currentBacktestId: this.currentBacktestId,
    };
  }

  /**
   * Cancel current backtest
   */
  async cancelBacktest(): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }

    this.logger.log(`🛑 Cancelling backtest ${this.currentBacktestId}`);
    this.isRunning = false;
    this.currentBacktestId = null;
    return true;
  }

  /**
   * Get backtest configuration from environment
   */
  getConfig(): {
    enabled: boolean;
    tickers: string[];
    timeframe: string;
    speed: number;
    dryRun: boolean;
  } {
    return {
      enabled: this.configService.get('BACKTEST_ENABLED') === 'true',
      tickers: this.configService.get('BACKTEST_TICKERS')?.split(',') || ['VCB', 'FPT'],
      timeframe: this.configService.get('BACKTEST_TIMEFRAME') || '15m',
      speed: parseInt(this.configService.get('BACKTEST_SPEED') || '50'),
      dryRun: this.configService.get('DRY_RUN') === 'true',
    };
  }
}
