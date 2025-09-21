import { Injectable, Logger } from '@nestjs/common';
import { FiinQuantDataService } from '../../../infrastructure/external-services/fiinquant-data.service';
import { MarketDataService } from '../../../infrastructure/database/market-data.service';
import { TechnicalIndicatorsService } from '../../../common/indicators/technical-indicators.service';
import { isValidTimeframe, DEFAULT_TIMEFRAME } from '../../../common/constants/timeframe.constants';

interface TimeframeResult {
  successful: number;
  failed: number;
  totalDataPoints: number;
  errors: string[];
}

@Injectable()
export class DataFetchService {
  private readonly logger = new Logger(DataFetchService.name);

  constructor(
    private readonly fiinQuantService: FiinQuantDataService,
    private readonly marketDataService: MarketDataService,
    private readonly indicatorsService: TechnicalIndicatorsService,
  ) {}

  async fetchAndSaveHistoricalData(
    tickers: string[], 
    timeframe: string = DEFAULT_TIMEFRAME, 
    periods: number = 100,
    fromDate?: string,
    toDate?: string
  ) {
    // Validate timeframe
    if (!isValidTimeframe(timeframe)) {
      throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
    }

    const results: any[] = [];
    let totalDataPoints = 0;
    const errors: string[] = [];
    
    for (const ticker of tickers) {
      try {
        this.logger.log(`Fetching historical data for ${ticker} (${timeframe})`);
        
        // 1. Fetch data from FiinQuant
        const marketData = await this.fiinQuantService.fetchHistoricalData(
          [ticker], timeframe, periods, fromDate, toDate
        );
        
        if (!marketData[ticker] || marketData[ticker].length === 0) {
          results.push({
            ticker,
            timeframe,
            success: false,
            message: 'No data received'
          });
          errors.push(`${ticker}: No data received`);
          continue;
        }
        
        // 2. Calculate technical indicators
        const dataWithIndicators = this.indicatorsService.calculateAllIndicators(marketData[ticker]);
        
        // 3. Save to appropriate timeframe collection
        const insertedCount = await this.marketDataService.bulkCreate(dataWithIndicators, timeframe);
        
        const latestPrice = dataWithIndicators[dataWithIndicators.length - 1]?.close || 0;
        totalDataPoints += insertedCount;
        
        results.push({
          ticker,
          timeframe,
          collection: `stock-ss${timeframe}`,
          success: true,
          dataPoints: dataWithIndicators.length,
          insertedCount,
          latestPrice
        });
        
        this.logger.log(`Successfully processed ${dataWithIndicators.length} data points for ${ticker} in ${timeframe}`);
        
      } catch (error) {
        this.logger.error(`Failed to fetch data for ${ticker} (${timeframe}):`, error);
        results.push({
          ticker,
          timeframe,
          success: false,
          message: error.message
        });
        errors.push(`${ticker}: ${error.message}`);
      }
    }
    
    const successfulCount = results.filter(r => r.success).length;
    this.logger.log(`Historical data fetch completed: ${successfulCount}/${tickers.length} successful`);
    
    return {
      success: successfulCount > 0,
      totalTickers: tickers.length,
      successfulTickers: successfulCount,
      failedTickers: tickers.length - successfulCount,
      totalDataPoints,
      errors,
      results
    };
  }

  async fetchLatestData(tickers: string[], timeframe: string = '15m') {
    try {
      const latestData = await this.fiinQuantService.fetchLatestData(tickers[0]);
      
      const results = {};
      for (const ticker of tickers) {
        if (latestData && latestData[ticker]) {
          results[ticker] = latestData[ticker];
        }
      }
      
      return results;
    } catch (error) {
      this.logger.error('Failed to fetch latest data:', error);
      throw error;
    }
  }

  async fetchIncrementalData(tickers: string[], timeframe: string = '15m') {
    const results: any[] = [];
    
    for (const ticker of tickers) {
      try {
        // 1. Get latest date from database
        const latestData = await this.marketDataService.getLatestData(ticker, timeframe);
        const lastDate = latestData?.timestamp;
        
        // 2. Fetch new data from FiinQuant
        const fromDate = lastDate ? new Date(lastDate.getTime() + 1).toISOString().split('T')[0] : undefined;
        const toDate = new Date().toISOString().split('T')[0];
        
        if (fromDate && fromDate >= toDate) {
          results.push({
            ticker,
            success: true,
            message: 'No new data available',
            newDataPoints: 0
          });
          continue;
        }
        
        const marketData = await this.fiinQuantService.fetchHistoricalData(
          [ticker], timeframe, 100, fromDate, toDate
        );
        
        if (!marketData[ticker] || marketData[ticker].length === 0) {
          results.push({
            ticker,
            success: true,
            message: 'No new data available',
            newDataPoints: 0
          });
          continue;
        }
        
        // 3. Calculate indicators
        const dataWithIndicators = this.indicatorsService.calculateAllIndicators(marketData[ticker]);
        
        // 4. Save new data
        const insertedCount = await this.marketDataService.bulkCreate(dataWithIndicators);
        
        results.push({
          ticker,
          success: true,
          newDataPoints: dataWithIndicators.length,
          insertedCount,
          fromDate,
          toDate
        });
        
      } catch (error) {
        this.logger.error(`Failed to fetch incremental data for ${ticker}:`, error);
        results.push({
          ticker,
          success: false,
          message: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Fetch data for 252 trading days (excluding weekends)
   * Logic: If current time is after 4 PM, include current day in the 252 days
   * Otherwise, start from next day
   */
  async fetchTradingDaysData(tickers: string[], timeframe) {
    try {
      this.logger.log(`Starting 252 trading days data fetch for ${tickers.length} tickers`);

      // Calculate date range for 252 trading days
      const { startDate, endDate, tradingDays } = this.calculateTradingDaysRange();
      
      this.logger.log(`Date range: ${startDate} to ${endDate} (${tradingDays} trading days)`);

      // Fetch data for all timeframes
      const timeframes = ['15m', '1h', '4h', '1d'];
      
      const results = {
        totalTickers: tickers.length,
        successfulTickers: 0,
        failedTickers: 0,
        totalDataPoints: 0,
        tradingDays,
        dateRange: { startDate, endDate },
        timeframeResults: {} as Record<string, TimeframeResult>,
        errors: []
      };

      for (const tf of timeframes) {
        this.logger.log(`Fetching data for timeframe: ${tf}`);
        
        const timeframeResults: TimeframeResult = {
          successful: 0,
          failed: 0,
          totalDataPoints: 0,
          errors: []
        };

        for (const ticker of tickers) {
          try {
            this.logger.log(`Fetching ${tf} data for ${ticker}`);
            
            // Fetch historical data
            const marketData = await this.fiinQuantService.fetchHistoricalData(
              [ticker], 
              tf, 
              1000, // Large number to get all available data
              startDate,
              endDate
            );

            if (!marketData[ticker] || marketData[ticker].length === 0) {
              this.logger.warn(`No data received for ${ticker} in ${tf}`);
              timeframeResults.failed++;
              timeframeResults.errors.push(`No data for ${ticker}`);
              continue;
            }

            // Calculate technical indicators
            const dataWithIndicators = this.indicatorsService.calculateAllIndicators(marketData[ticker]);

            // Save to database
            const insertedCount = await this.marketDataService.bulkCreate(dataWithIndicators, tf);

            timeframeResults.successful++;
            timeframeResults.totalDataPoints += insertedCount;

            this.logger.log(`Successfully processed ${ticker} (${tf}): ${insertedCount} data points`);

          } catch (error) {
            this.logger.error(`Failed to fetch ${tf} data for ${ticker}:`, error);
            timeframeResults.failed++;
            timeframeResults.errors.push(`${ticker}: ${error.message}`);
          }
        }

        results.timeframeResults[tf] = timeframeResults;
        results.totalDataPoints += timeframeResults.totalDataPoints;
      }

      // Calculate overall success/failure counts
      results.successfulTickers = Object.values(results.timeframeResults)
        .reduce((sum, tf) => sum + tf.successful, 0);
      results.failedTickers = Object.values(results.timeframeResults)
        .reduce((sum, tf) => sum + tf.failed, 0);

      this.logger.log(`Trading days data fetch completed: ${results.successfulTickers} successful, ${results.failedTickers} failed`);

      return results;

    } catch (error) {
      this.logger.error('Failed to fetch trading days data:', error);
      throw error;
    }
  }

  /**
   * Calculate date range for 252 trading days
   * Excludes weekends (Saturday = 6, Sunday = 0)
   */
  private calculateTradingDaysRange(): { startDate: string, endDate: string, tradingDays: number } {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    // Check if current time is after 4 PM (16:00)
    const isAfter4PM = vietnamTime.getHours() >= 16;
    
    let currentDate = new Date(vietnamTime);
    
    // If after 4 PM, include current day in the 252 days
    // Otherwise, start from next day
    if (!isAfter4PM) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Find the next trading day (Monday-Friday)
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const endDate = new Date(currentDate);
    const startDate = new Date(currentDate);
    
    // Count back 252 trading days
    let tradingDays = 0;
    let daysBack = 0;
    
    while (tradingDays < 252) {
      daysBack++;
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - daysBack);
      
      // Skip weekends
      if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) {
        tradingDays++;
        startDate.setTime(checkDate.getTime());
      }
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      tradingDays: 252
    };
  }
}
