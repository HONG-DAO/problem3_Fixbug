import { Injectable, Logger } from '@nestjs/common';
import { RSIPSAREngulfingStrategy } from '../../../common/strategies/rsi-psar-engulfing.strategy';
import { FiinQuantDataService } from '../../../infrastructure/external-services/fiinquant-data.service';
import { TradingSignalService } from '../../../infrastructure/database/trading-signal.service';
import { MarketDataService } from '../../../infrastructure/database/market-data.service';
import { TechnicalIndicatorsService } from '../../../common/indicators/technical-indicators.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly strategy: RSIPSAREngulfingStrategy,
    private readonly fiinQuantService: FiinQuantDataService,
    private readonly signalService: TradingSignalService,
    private readonly marketDataService: MarketDataService,
    private readonly indicatorsService: TechnicalIndicatorsService,
  ) {}

  async analyzeSingleTicker(ticker: string, periods: number = 100) {
    try {
      this.logger.log(`Starting analysis for ${ticker}`);
      
      // 1. Fetch market data
      const marketData = await this.fiinQuantService.fetchHistoricalData(
        [ticker], '15m', periods
      );
      
      if (!marketData[ticker] || marketData[ticker].length === 0) {
        throw new Error(`No data received for ${ticker}`);
      }

      // 2. Calculate technical indicators
      const dataWithIndicators = this.indicatorsService.calculateAllIndicators(marketData[ticker]);
      
      // 3. Save market data to database
      const insertedCount = await this.marketDataService.bulkCreate(dataWithIndicators);
      
      // 4. Generate trading signals
      const signals = await this.strategy.analyzeTicker(ticker, dataWithIndicators);
      
      // 5. Save signals to database
      const savedSignals: any[] = [];
      for (const signal of signals) {
        const savedSignal = await this.signalService.createFromSignal(signal);
        savedSignals.push(savedSignal);
      }
      
      const latestPrice = dataWithIndicators[dataWithIndicators.length - 1]?.close || 0;
      
      return {
        ticker,
        success: true,
        dataPoints: dataWithIndicators.length,
        insertedCount,
        signalCount: savedSignals.length,
        latestPrice,
        signals: savedSignals,
        lastUpdate: new Date()
      };
      
    } catch (error) {
      this.logger.error(`Analysis failed for ${ticker}:`, error);
      return {
        ticker,
        success: false,
        message: error.message
      };
    }
  }

  async analyzeBulkTickers(tickers: string[], periods: number = 100) {
    const batchSize = 5; // Process 5 tickers at a time
    const results: any[] = [];
    
    this.logger.log(`Starting bulk analysis for ${tickers.length} tickers in batches of ${batchSize}`);
    
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
      
      const batchPromises = batch.map(ticker => this.analyzeSingleTicker(ticker, periods));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async getAnalysisHistory(ticker: string, days: number = 7) {
    try {
      const signals = await this.signalService.findByTicker(ticker, 50);
      const marketData = await this.marketDataService.getHistoricalData(ticker, '15m', 100);
      
      return {
        ticker,
        signals,
        marketData,
        period: `${days} days`,
        lastUpdate: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to get analysis history for ${ticker}:`, error);
      throw error;
    }
  }
}
