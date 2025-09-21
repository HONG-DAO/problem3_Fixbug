import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { IMarketDataPoint } from '../../common/interfaces/trading.interface';
import { 
  Timeframe, 
  getCollectionName, 
  getModelName, 
  isValidTimeframe,
  DEFAULT_TIMEFRAME,
  getIntervalMinutes
} from '../../common/constants/timeframe.constants';

// Import all schemas
import { MarketData1D, MarketData1DSchema } from '../../schemas/market-data-1d.schema';
import { MarketData4H, MarketData4HSchema } from '../../schemas/market-data-4h.schema';
import { MarketData1H, MarketData1HSchema } from '../../schemas/market-data-1h.schema';
import { MarketData15M, MarketData15MSchema } from '../../schemas/market-data-15m.schema';
import { MarketData1M, MarketData1MSchema } from '../../schemas/market-data-1m.schema';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private models: Map<string, Model<any>> = new Map();

  constructor(@InjectConnection() private connection: Connection) {
    this.initializeModels();
  }

  private initializeModels(): void {
    try {
      // Register models for supported timeframes
      this.models.set(Timeframe.ONE_DAY, this.connection.model('MarketData1D', MarketData1DSchema, 'stock-ss1d'));
      this.models.set(Timeframe.FOUR_HOURS, this.connection.model('MarketData4H', MarketData4HSchema, 'stock-ss4h'));
      this.models.set(Timeframe.ONE_HOUR, this.connection.model('MarketData1H', MarketData1HSchema, 'stock-ss1h'));
      this.models.set(Timeframe.FIFTEEN_MINUTES, this.connection.model('MarketData15M', MarketData15MSchema, 'stock-ss15m'));
      this.models.set(Timeframe.ONE_MINUTE, this.connection.model('MarketData1M', MarketData1MSchema, 'stock-ss1m'));

      this.logger.log('Multi-timeframe market data models initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize multi-timeframe models:', error);
      throw error;
    }
  }

  /**
   * Get model for specific timeframe
   */
  private getModel(timeframe: string): Model<any> {
    if (!isValidTimeframe(timeframe)) {
      this.logger.warn(`Invalid timeframe: ${timeframe}, using default: ${DEFAULT_TIMEFRAME}`);
      timeframe = DEFAULT_TIMEFRAME;
    }

    const model = this.models.get(timeframe);
    if (!model) {
      throw new Error(`Model not found for timeframe: ${timeframe}`);
    }

    return model;
  }

  /**
   * Create new market data point
   */
  async create(createDataDto: IMarketDataPoint, timeframe: string = DEFAULT_TIMEFRAME): Promise<any> {
    try {
      const model = this.getModel(timeframe);
      const collectionName = getCollectionName(timeframe);
      
      const marketData = new model({
        ...createDataDto,
        timeframe,
        timestamp: new Date(createDataDto.timestamp),
      });

      const savedData = await marketData.save();
      this.logger.debug(`Created market data for ${savedData.ticker} at ${savedData.timestamp} in ${collectionName}`);
      
      return savedData;
    } catch (error) {
      this.logger.error(`Failed to create market data in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Bulk insert market data
   */
  async bulkCreate(dataPoints: IMarketDataPoint[], timeframe: string = DEFAULT_TIMEFRAME): Promise<number> {
    try {
      const model = this.getModel(timeframe);
      const collectionName = getCollectionName(timeframe);

      // Ensure all data points have the correct timeframe
      const formattedDataPoints = dataPoints.map(point => ({
        ...point,
        timeframe,
        timestamp: new Date(point.timestamp),
      }));

      const result = await model.insertMany(formattedDataPoints, {
        ordered: false, // Continue on duplicates
      });

      this.logger.log(`Bulk inserted ${result.length} market data points into ${collectionName}`);
      return result.length;
    } catch (error) {
      // Handle duplicate key errors gracefully
      if (error.code === 11000) {
        const insertedCount = error.result?.result?.nInserted || 0;
        this.logger.warn(`Bulk insert completed with ${insertedCount} new records in ${getCollectionName(timeframe)} (some duplicates skipped)`);
        return insertedCount;
      }
      
      this.logger.error(`Failed to bulk create market data in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Find market data with query parameters
   */
  async findMany(query: {
    ticker?: string;
    tickers?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }, timeframe: string = DEFAULT_TIMEFRAME): Promise<{
    data: any[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const model = this.getModel(timeframe);
      const filter: any = {};

      // Apply filters
      if (query.ticker) {
        filter.ticker = query.ticker;
      }

      if (query.tickers && query.tickers.length > 0) {
        filter.ticker = { $in: query.tickers };
      }

      if (query.startDate || query.endDate) {
        filter.timestamp = {};
        if (query.startDate) {
          filter.timestamp.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          filter.timestamp.$lte = new Date(query.endDate);
        }
      }

      // Get total count
      const total = await model.countDocuments(filter);

      // Get data with pagination
      const data = await model
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(query.offset || 0)
        .limit(query.limit || 100)
        .exec();

      const hasMore = (query.offset || 0) + data.length < total;

      this.logger.debug(`Found ${data.length} market data points in ${getCollectionName(timeframe)} (${total} total)`);

      return {
        data,
        total,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`Failed to find market data in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Get historical data for ticker
   */
  async getHistoricalData(
    ticker: string,
    timeframe: string = DEFAULT_TIMEFRAME,
    limit: number = 100,
    fromDate?: Date,
    toDate?: Date
  ): Promise<any[]> {
    try {
      const model = this.getModel(timeframe);
      const filter: any = { ticker };

      if (fromDate || toDate) {
        filter.timestamp = {};
        if (fromDate) {
          filter.timestamp.$gte = fromDate;
        }
        if (toDate) {
          filter.timestamp.$lte = toDate;
        }
      }

      const data = await model
        .find(filter)
        .sort({ timestamp: 1 }) // Ascending for historical data
        .limit(limit)
        .exec();

      this.logger.debug(`Retrieved ${data.length} historical data points for ${ticker} in ${getCollectionName(timeframe)}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to get historical data for ${ticker} in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Get latest data point for ticker
   */
  async getLatestData(ticker: string, timeframe: string = DEFAULT_TIMEFRAME): Promise<any | null> {
    try {
      const model = this.getModel(timeframe);
      
      const data = await model
        .findOne({ ticker })
        .sort({ timestamp: -1 })
        .exec();

      if (data) {
        this.logger.debug(`Retrieved latest data for ${ticker} in ${getCollectionName(timeframe)}`);
      } else {
        this.logger.debug(`No data found for ${ticker} in ${getCollectionName(timeframe)}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Failed to get latest data for ${ticker} in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Get latest data for multiple tickers
   */
  async getLatestDataForTickers(tickers: string[], timeframe: string = DEFAULT_TIMEFRAME): Promise<Map<string, any>> {
    try {
      const model = this.getModel(timeframe);
      
      const pipeline = [
        {
          $match: {
            ticker: { $in: tickers },
          },
        },
        {
          $sort: { timestamp: -1 as const },
        },
        {
          $group: {
            _id: '$ticker',
            latestData: { $first: '$$ROOT' },
          },
        },
      ];

      const results = await model.aggregate(pipeline);
      
      const latestDataMap = new Map<string, any>();
      results.forEach((result) => {
        latestDataMap.set(result._id, result.latestData);
      });

      this.logger.debug(`Retrieved latest data for ${latestDataMap.size}/${tickers.length} tickers in ${getCollectionName(timeframe)}`);
      return latestDataMap;
    } catch (error) {
      this.logger.error(`Failed to get latest data for tickers in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Update market data with technical indicators
   */
  async updateWithIndicators(
    ticker: string,
    timestamp: Date,
    timeframe: string,
    indicators: any
  ): Promise<any | null> {
    try {
      const model = this.getModel(timeframe);
      
      const updatedData = await model
        .findOneAndUpdate(
          { ticker, timestamp },
          { $set: indicators },
          { new: true }
        )
        .exec();

      if (updatedData) {
        this.logger.debug(`Updated indicators for ${ticker} at ${timestamp} in ${getCollectionName(timeframe)}`);
      } else {
        this.logger.warn(`No data found to update for ${ticker} at ${timestamp} in ${getCollectionName(timeframe)}`);
      }

      return updatedData;
    } catch (error) {
      this.logger.error(`Failed to update indicators for ${ticker} in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update with indicators
   */
  async bulkUpdateWithIndicators(updates: Array<{
    ticker: string;
    timestamp: Date;
    indicators: any;
  }>, timeframe: string = DEFAULT_TIMEFRAME): Promise<number> {
    try {
      const model = this.getModel(timeframe);
      
      const operations = updates.map((update) => ({
        updateOne: {
          filter: {
            ticker: update.ticker,
            timestamp: update.timestamp,
          },
          update: { $set: update.indicators },
        },
      }));

      const result = await model.bulkWrite(operations);
      
      this.logger.log(`Bulk updated ${result.modifiedCount} records with indicators in ${getCollectionName(timeframe)}`);
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`Failed to bulk update with indicators in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Get market statistics for timeframe
   */
  async getMarketStatistics(hours: number = 24, timeframe: string = DEFAULT_TIMEFRAME): Promise<any> {
    try {
      const model = this.getModel(timeframe);
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const stats = await model.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoffTime },
          },
        },
        {
          $group: {
            _id: '$ticker',
            count: { $sum: 1 },
            avgVolume: { $avg: '$volume' },
            maxPrice: { $max: '$high' },
            minPrice: { $min: '$low' },
            latestPrice: { $last: '$close' },
            totalVolume: { $sum: '$volume' },
          },
        },
        {
          $sort: { totalVolume: -1 },
        },
      ]);

      // Get total data points
      const totalDataPoints = await model.countDocuments({
        timestamp: { $gte: cutoffTime },
      });

      const result = {
        timeframe,
        collection: getCollectionName(timeframe),
        totalDataPoints,
        uniqueTickers: stats.length,
        topByVolume: stats.slice(0, 10),
        period: `${hours} hours`,
      };

      this.logger.debug(`Generated market statistics for ${timeframe} (${hours} hours)`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get market statistics for ${timeframe}:`, error);
      throw error;
    }
  }

  /**
   * Get OHLCV data for charts
   */
  async getOHLCVData(ticker: string, timeframe: string = DEFAULT_TIMEFRAME, limit: number = 100): Promise<any[]> {
    try {
      const model = this.getModel(timeframe);
      
      const data = await model
        .find({ ticker })
        .sort({ timestamp: 1 })
        .limit(limit)
        .select('timestamp open high low close volume')
        .exec();

      const ohlcvData = data.map((point) => ({
        time: point.timestamp.getTime(),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
      }));

      this.logger.debug(`Retrieved ${ohlcvData.length} OHLCV data points for ${ticker}`);
      return ohlcvData;
    } catch (error) {
      this.logger.error(`Failed to get OHLCV data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get data range for ticker in specific timeframe
   */
  async getDataRange(ticker: string, timeframe: string = DEFAULT_TIMEFRAME): Promise<{
    startDate: Date | null;
    endDate: Date | null;
    count: number;
  }> {
    try {
      const model = this.getModel(timeframe);
      
      const pipeline = [
        {
          $match: { ticker },
        },
        {
          $group: {
            _id: null,
            startDate: { $min: '$timestamp' },
            endDate: { $max: '$timestamp' },
            count: { $sum: 1 },
          },
        },
      ];

      const result = await model.aggregate(pipeline);
      
      if (result.length > 0) {
        const { startDate, endDate, count } = result[0];
        this.logger.debug(`Data range for ${ticker} in ${getCollectionName(timeframe)}: ${startDate} to ${endDate} (${count} points)`);
        return { startDate, endDate, count };
      } else {
        return { startDate: null, endDate: null, count: 0 };
      }
    } catch (error) {
      this.logger.error(`Failed to get data range for ${ticker} in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Delete old market data
   */
  async deleteOldData(days: number = 30, timeframe: string = DEFAULT_TIMEFRAME): Promise<number> {
    try {
      const model = this.getModel(timeframe);
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await model.deleteMany({
        timestamp: { $lt: cutoffTime },
      });

      this.logger.log(`Deleted ${result.deletedCount} market data points older than ${days} days from ${getCollectionName(timeframe)}`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete old market data from ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Find missing data for ticker in specific timeframe
   */
  async findMissingData(ticker: string, timeframe: string = DEFAULT_TIMEFRAME): Promise<Date[]> {
    try {
      const model = this.getModel(timeframe);
      const expectedIntervalMinutes = getIntervalMinutes(timeframe);
      
      const data = await model
        .find({ ticker })
        .sort({ timestamp: 1 })
        .select('timestamp')
        .exec();

      const missingDates: Date[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const current = data[i].timestamp;
        const previous = data[i - 1].timestamp;
        const expectedNext = new Date(previous.getTime() + expectedIntervalMinutes * 60 * 1000);
        
        if (current.getTime() - expectedNext.getTime() > expectedIntervalMinutes * 60 * 1000) {
          // There's a gap
          let missingTime = new Date(expectedNext);
          while (missingTime < current) {
            missingDates.push(new Date(missingTime));
            missingTime = new Date(missingTime.getTime() + expectedIntervalMinutes * 60 * 1000);
          }
        }
      }

      this.logger.debug(`Found ${missingDates.length} missing data points for ${ticker} in ${getCollectionName(timeframe)}`);
      return missingDates;
    } catch (error) {
      this.logger.error(`Failed to find missing data for ${ticker} in ${getCollectionName(timeframe)}:`, error);
      throw error;
    }
  }

  /**
   * Get collection information for all timeframes
   */
  async getCollectionInfo(): Promise<any> {
    const info = {};
    
    for (const timeframe of Object.values(Timeframe)) {
      try {
        const model = this.getModel(timeframe);
        const count = await model.countDocuments();
        const collectionName = getCollectionName(timeframe);
        
        info[timeframe] = {
          collectionName,
          documentCount: count,
          intervalMinutes: getIntervalMinutes(timeframe),
        };
      } catch (error) {
        this.logger.error(`Failed to get info for ${timeframe}:`, error);
        info[timeframe] = {
          collectionName: getCollectionName(timeframe),
          documentCount: 0,
          error: error.message,
        };
      }
    }
    
    return info;
  }
}
