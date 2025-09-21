import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from '../../../infrastructure/database/market-data.service';
import { FiinQuantDataService } from '../../../infrastructure/external-services/fiinquant-data.service';
import { MarketDataQueryDto } from '../dto/market-data.dto';
import { isValidTimeframe, DEFAULT_TIMEFRAME } from '../../../common/constants/timeframe.constants';

@Injectable()
export class DataQueryService {
  private readonly logger = new Logger(DataQueryService.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly fiinQuantService: FiinQuantDataService,
  ) {}

  async queryMarketData(query: MarketDataQueryDto) {
    try {
      const timeframe = query.timeframe || DEFAULT_TIMEFRAME;
      
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      // Convert DTO to service query format
      const serviceQuery = {
        ticker: query.ticker,
        tickers: query.tickers,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: query.limit,
        offset: query.offset
      };
      
      // Use multi-timeframe service for the appropriate collection
      const result = await this.marketDataService.findMany(serviceQuery, timeframe);
      
      return {
        ...result,
        timeframe,
        collection: `stock-ss${timeframe}`,
      };
    } catch (error) {
      this.logger.error('Failed to query market data:', error);
      throw error;
    }
  }

  async getHistoricalData(
    ticker: string, 
    timeframe: string = DEFAULT_TIMEFRAME, 
    limit: number = 100,
    fromDate?: Date,
    toDate?: Date
  ) {
    try {
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      const data = await this.marketDataService.getHistoricalData(
        ticker, timeframe, limit, fromDate, toDate
      );
      
      return {
        ticker,
        timeframe,
        collection: `stock-ss${timeframe}`,
        count: data.length,
        data,
        period: {
          from: fromDate?.toISOString() || 'N/A',
          to: toDate?.toISOString() || 'N/A'
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get historical data for ${ticker}:`, error);
      throw error;
    }
  }

  async getLatestData(ticker: string, timeframe: string = DEFAULT_TIMEFRAME) {
    try {
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      const data = await this.marketDataService.getLatestData(ticker, timeframe);
      
      return {
        ticker,
        timeframe,
        collection: `stock-ss${timeframe}`,
        data,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to get latest data for ${ticker}:`, error);
      throw error;
    }
  }

  async getOHLCVData(ticker: string, timeframe: string = DEFAULT_TIMEFRAME, limit: number = 100) {
    try {
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      // Get historical data from appropriate collection
      const rawData = await this.marketDataService.getHistoricalData(ticker, timeframe, limit);
      
      // Format for OHLCV output
      const data = rawData.map(item => ({
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));
      
      return {
        ticker,
        timeframe,
        collection: `stock-ss${timeframe}`,
        count: data.length,
        data
      };
    } catch (error) {
      this.logger.error(`Failed to get OHLCV data for ${ticker}:`, error);
      throw error;
    }
  }

  async getMarketStatistics(hours: number = 24, timeframe: string = DEFAULT_TIMEFRAME) {
    try {
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      const stats = await this.marketDataService.getMarketStatistics(hours, timeframe);
      
      return {
        ...stats,
        period: `${hours} hours`,
        generatedAt: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get market statistics:', error);
      throw error;
    }
  }

  async getDataRange(ticker: string, timeframe: string = DEFAULT_TIMEFRAME) {
    try {
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      const range = await this.marketDataService.getDataRange(ticker, timeframe);
      
      return {
        ticker,
        timeframe,
        collection: `stock-ss${timeframe}`,
        ...range
      };
    } catch (error) {
      this.logger.error(`Failed to get data range for ${ticker}:`, error);
      throw error;
    }
  }

  async findMissingData(ticker: string, timeframe: string = DEFAULT_TIMEFRAME) {
    try {
      // Validate timeframe
      if (!isValidTimeframe(timeframe)) {
        throw new Error(`Invalid timeframe: ${timeframe}. Supported: 1d, 4h, 1h, 15m`);
      }

      const missingDates = await this.marketDataService.findMissingData(ticker, timeframe);
      
      return {
        ticker,
        timeframe,
        collection: `stock-ss${timeframe}`,
        missingCount: missingDates.length,
        missingDates: missingDates.slice(0, 50), // Limit to 50 for response size
        hasMore: missingDates.length > 50
      };
    } catch (error) {
      this.logger.error(`Failed to find missing data for ${ticker}:`, error);
      throw error;
    }
  }

  async getAllTickers(): Promise<string[]> {
    try {
      const tickers = await this.fiinQuantService.getAllTickers();
      
      this.logger.debug(`Retrieved ${tickers.length} tickers from FiinQuant`);
      return tickers;
    } catch (error) {
      this.logger.error('Failed to get all tickers:', error);
      throw error;
    }
  }

  /**
   * Get collection information for all timeframes
   */
  async getCollectionInfo() {
    try {
      const info = await this.marketDataService.getCollectionInfo();
      
      return {
        collections: info,
        supportedTimeframes: ['1d', '4h', '1h', '15m'],
        defaultTimeframe: DEFAULT_TIMEFRAME,
        generatedAt: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get collection info:', error);
      throw error;
    }
  }
}
