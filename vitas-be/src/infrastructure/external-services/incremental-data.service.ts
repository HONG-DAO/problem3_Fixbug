import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from '../database/market-data.service';
import { FiinQuantDataService } from './fiinquant-data.service';
import { TechnicalIndicatorsService } from '../../common/indicators/technical-indicators.service';
import { IMarketDataPoint } from '../../common/interfaces/trading.interface';

@Injectable()
export class IncrementalDataService {
  private readonly logger = new Logger(IncrementalDataService.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly fiinQuantService: FiinQuantDataService,
    private readonly indicatorsService: TechnicalIndicatorsService,
  ) {}

  /**
   * Process incremental data for a ticker
   * Only fetch and process new data since last update
   */
  async processIncrementalData(
    ticker: string,
    timeframe: string = '15m'
  ): Promise<{
    success: boolean;
    newDataPoints: number;
    latestPrice: number;
    indicatorsCalculated: boolean;
    message?: string;
  }> {
    try {
      this.logger.log(`Processing incremental data for ${ticker}`);

      // 1. Get latest data date from database
      const dataRange = await this.marketDataService.getDataRange(ticker, timeframe);
      const lastUpdateDate = dataRange.endDate;

      // 2. Determine date range for fetching
      let fromDate: string;
      if (lastUpdateDate) {
        // Fetch from day after last update
        const nextDay = new Date(lastUpdateDate);
        nextDay.setDate(nextDay.getDate() + 1);
        fromDate = nextDay.toISOString().split('T')[0];
      } else {
        // No data exists, fetch last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        fromDate = thirtyDaysAgo.toISOString().split('T')[0];
      }

      const toDate = new Date().toISOString().split('T')[0];

      // 3. Check if we need to fetch new data
      if (lastUpdateDate && fromDate > toDate) {
        this.logger.log(`No new data needed for ${ticker} - up to date`);
        return {
          success: true,
          newDataPoints: 0,
          latestPrice: 0,
          indicatorsCalculated: false,
          message: 'No new data available'
        };
      }

      // 4. Fetch new data from FiinQuant
      const marketDataMap = await this.fiinQuantService.fetchHistoricalData(
        [ticker],
        timeframe,
        1000, // Large number to get all available data
        fromDate,
        toDate
      );

      const newData = marketDataMap[ticker] || [];
      
      if (newData.length === 0) {
        this.logger.log(`No new data received for ${ticker}`);
        return {
          success: true,
          newDataPoints: 0,
          latestPrice: 0,
          indicatorsCalculated: false,
          message: 'No new data received from FiinQuant'
        };
      }

      // 5. Get existing data for indicator calculation
      const existingData = await this.marketDataService.getHistoricalData(
        ticker,
        timeframe,
        200, // Get enough data for indicator calculation
        undefined,
        lastUpdateDate || undefined
      );

      // 6. Combine existing and new data for indicator calculation
      const allData = [
        ...existingData.map(item => ({
          ticker: item.ticker,
          timestamp: item.timestamp,
          timeframe: item.timeframe,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          change: item.change,
          changePercent: item.changePercent,
          totalMatchValue: item.totalMatchValue,
          foreignBuyVolume: item.foreignBuyVolume,
          foreignSellVolume: item.foreignSellVolume,
          matchVolume: item.matchVolume,
          rsi: item.rsi,
          psar: item.psar,
          psarTrend: item.psarTrend,
          engulfingSignal: item.engulfingSignal,
          volumeAnomaly: item.volumeAnomaly,
          priceVsPsar: item.priceVsPsar,
          avgVolume20: item.avgVolume20,
        })),
        ...newData
      ];

      // 7. Calculate indicators for all data
      const dataWithIndicators = this.indicatorsService.calculateAllIndicators(allData);

      // 8. Save only new data to database
      const newDataWithIndicators = dataWithIndicators.slice(-newData.length);
      const insertedCount = await this.marketDataService.bulkCreate(newDataWithIndicators);

      // 9. Update existing data with new indicators (if needed)
      if (existingData.length > 0) {
        const updates = dataWithIndicators.slice(0, -newData.length).map(point => ({
          ticker: point.ticker,
          timestamp: point.timestamp,
          timeframe: point.timeframe,
          indicators: {
            rsi: (point as any).rsi,
            psar: (point as any).psar,
            psarTrend: (point as any).psarTrend,
            engulfingSignal: (point as any).engulfingPattern,
            volumeAnomaly: (point as any).volumeAnomaly,
            priceVsPsar: (point as any).priceVsPsar,
            avgVolume20: (point as any).avgVolume20,
          },
        }));

        if (updates.length > 0) {
          await this.marketDataService.bulkUpdateWithIndicators(updates);
        }
      }

      const latestPrice = newDataWithIndicators[newDataWithIndicators.length - 1]?.close || 0;

      this.logger.log(
        `Incremental processing completed for ${ticker}: ${insertedCount} new data points, latest price: ${latestPrice}`
      );

      return {
        success: true,
        newDataPoints: insertedCount,
        latestPrice,
        indicatorsCalculated: true,
        message: `Successfully processed ${insertedCount} new data points`
      };

    } catch (error) {
      this.logger.error(`Failed to process incremental data for ${ticker}:`, error);
      return {
        success: false,
        newDataPoints: 0,
        latestPrice: 0,
        indicatorsCalculated: false,
        message: error.message
      };
    }
  }

  /**
   * Process incremental data for multiple tickers
   */
  async processBulkIncrementalData(
    tickers: string[],
    timeframe: string = '15m'
  ): Promise<{
    success: boolean;
    results: Array<{
      ticker: string;
      success: boolean;
      newDataPoints: number;
      latestPrice: number;
      message?: string;
    }>;
    totalNewDataPoints: number;
  }> {
    try {
      this.logger.log(`Processing incremental data for ${tickers.length} tickers`);

      const results: Array<{
        ticker: string;
        success: boolean;
        newDataPoints: number;
        latestPrice: number;
        message?: string;
      }> = [];
      let totalNewDataPoints = 0;

      // Process tickers in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (ticker) => {
          const result = await this.processIncrementalData(ticker, timeframe);
          return {
            ticker,
            success: result.success,
            newDataPoints: result.newDataPoints,
            latestPrice: result.latestPrice,
            message: result.message
          };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        totalNewDataPoints += batchResults.reduce((sum, r) => sum + r.newDataPoints, 0);

        // Small delay between batches
        if (i + batchSize < tickers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.success).length;

      this.logger.log(
        `Bulk incremental processing completed: ${successCount}/${tickers.length} successful, ${totalNewDataPoints} total new data points`
      );

      return {
        success: true,
        results,
        totalNewDataPoints
      };

    } catch (error) {
      this.logger.error('Failed to process bulk incremental data:', error);
      return {
        success: false,
        results: [],
        totalNewDataPoints: 0
      };
    }
  }

  /**
   * Get data freshness status for all tickers
   */
  async getDataFreshnessStatus(tickers: string[], timeframe: string = '15m'): Promise<{
    ticker: string;
    lastUpdate: Date | null;
    dataPoints: number;
    isStale: boolean;
    hoursSinceUpdate: number;
  }[]> {
    try {
      const statuses: Array<{
        ticker: string;
        lastUpdate: Date | null;
        dataPoints: number;
        isStale: boolean;
        hoursSinceUpdate: number;
      }> = [];

      for (const ticker of tickers) {
        const dataRange = await this.marketDataService.getDataRange(ticker, timeframe);
        const now = new Date();
        const hoursSinceUpdate = dataRange.endDate 
          ? (now.getTime() - dataRange.endDate.getTime()) / (1000 * 60 * 60)
          : Infinity;

        statuses.push({
          ticker,
          lastUpdate: dataRange.endDate,
          dataPoints: dataRange.count,
          isStale: hoursSinceUpdate > 24, // Consider stale if older than 24 hours
          hoursSinceUpdate: Math.round(hoursSinceUpdate * 100) / 100
        });
      }

      return statuses;
    } catch (error) {
      this.logger.error('Failed to get data freshness status:', error);
      return [];
    }
  }
}
