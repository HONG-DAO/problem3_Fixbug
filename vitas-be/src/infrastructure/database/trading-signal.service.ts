import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradingSignal, TradingSignalDocument } from '../../schemas/trading-signal.schema';
import { CreateTradingSignalDto, QueryTradingSignalsDto } from '../../common/dto/trading-signal.dto';
import { ITradingSignal } from '../../common/interfaces/trading.interface';

@Injectable()
export class TradingSignalService {
  private readonly logger = new Logger(TradingSignalService.name);

  constructor(
    @InjectModel(TradingSignal.name)
    private readonly tradingSignalModel: Model<TradingSignalDocument>,
  ) {}

  /**
   * Create a new trading signal
   */
  async create(createSignalDto: CreateTradingSignalDto): Promise<TradingSignal> {
    try {
      const signal = new this.tradingSignalModel({
        ...createSignalDto,
        timestamp: new Date(createSignalDto.timestamp),
      });

      const savedSignal = await signal.save();
      this.logger.debug(`Created signal: ${savedSignal.signalType} for ${savedSignal.ticker}`);
      
      return savedSignal;
    } catch (error) {
      this.logger.error('Failed to create trading signal:', error);
      throw error;
    }
  }

  /**
   * Create trading signal from interface
   */
  async createFromSignal(signal: ITradingSignal): Promise<TradingSignal> {
    try {
      const signalDoc = new this.tradingSignalModel(signal);
      const savedSignal = await signalDoc.save();
      
      this.logger.debug(`Created signal: ${savedSignal.signalType} for ${savedSignal.ticker}`);
      return savedSignal;
    } catch (error) {
      this.logger.error('Failed to create trading signal from interface:', error);
      throw error;
    }
  }

  /**
   * Find signals with query parameters
   */
  async findMany(query: QueryTradingSignalsDto): Promise<{
    signals: TradingSignal[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const filter: any = {};

      // Apply filters
      if (query.ticker) {
        filter.ticker = query.ticker;
      }

      if (query.signalType) {
        filter.signalType = query.signalType;
      }

      if (query.minConfidence) {
        filter.confidence = { $gte: query.minConfidence };
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
      const total = await this.tradingSignalModel.countDocuments(filter);

      // Get signals with pagination
      const signals = await this.tradingSignalModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(query.offset || 0)
        .limit(query.limit || 100)
        .exec();

      const hasMore = (query.offset || 0) + signals.length < total;

      this.logger.debug(`Found ${signals.length} signals (${total} total)`);

      return {
        signals,
        total,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to find trading signals:', error);
      throw error;
    }
  }

  /**
   * Find recent signals
   */
  async findRecent(hours: number = 24, limit: number = 100): Promise<TradingSignal[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const signals = await this.tradingSignalModel
        .find({
          timestamp: { $gte: cutoffTime },
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();

      this.logger.debug(`Found ${signals.length} recent signals in last ${hours} hours`);
      return signals;
    } catch (error) {
      this.logger.error('Failed to find recent signals:', error);
      throw error;
    }
  }

  /**
   * Find signals by ticker
   */
  async findByTicker(ticker: string, limit: number = 50): Promise<TradingSignal[]> {
    try {
      const signals = await this.tradingSignalModel
        .find({ ticker })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();

      this.logger.debug(`Found ${signals.length} signals for ${ticker}`);
      return signals;
    } catch (error) {
      this.logger.error(`Failed to find signals for ticker ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Find signals by type
   */
  async findByType(signalType: string, hours: number = 24): Promise<TradingSignal[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const signals = await this.tradingSignalModel
        .find({
          signalType,
          timestamp: { $gte: cutoffTime },
        })
        .sort({ timestamp: -1 })
        .exec();

      this.logger.debug(`Found ${signals.length} ${signalType} signals in last ${hours} hours`);
      return signals;
    } catch (error) {
      this.logger.error(`Failed to find ${signalType} signals:`, error);
      throw error;
    }
  }

  /**
   * Get signal statistics
   */
  async getStatistics(hours: number = 24): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const stats = await this.tradingSignalModel.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoffTime },
          },
        },
        {
          $group: {
            _id: '$signalType',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            maxConfidence: { $max: '$confidence' },
            minConfidence: { $min: '$confidence' },
          },
        },
      ]);

      // Get total signals
      const totalSignals = await this.tradingSignalModel.countDocuments({
        timestamp: { $gte: cutoffTime },
      });

      // Get unique tickers
      const uniqueTickers = await this.tradingSignalModel.distinct('ticker', {
        timestamp: { $gte: cutoffTime },
      });

      const result = {
        totalSignals,
        uniqueTickers: uniqueTickers.length,
        byType: {},
        period: `${hours} hours`,
      };

      // Process stats by type
      stats.forEach((stat) => {
        result.byType[stat._id] = {
          count: stat.count,
          avgConfidence: stat.avgConfidence,
          maxConfidence: stat.maxConfidence,
          minConfidence: stat.minConfidence,
        };
      });

      this.logger.debug(`Generated statistics for ${hours} hours`);
      return result;
    } catch (error) {
      this.logger.error('Failed to get signal statistics:', error);
      throw error;
    }
  }

  /**
   * Get signal performance (confidence distribution)
   */
  async getPerformanceMetrics(days: number = 7): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const metrics = await this.tradingSignalModel.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoffTime },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp',
              },
            },
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            buySignals: {
              $sum: {
                $cond: [{ $eq: ['$signalType', 'buy'] }, 1, 0],
              },
            },
            sellSignals: {
              $sum: {
                $cond: [{ $eq: ['$signalType', 'sell'] }, 1, 0],
              },
            },
            riskWarnings: {
              $sum: {
                $cond: [{ $eq: ['$signalType', 'risk_warning'] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      this.logger.debug(`Generated performance metrics for ${days} days`);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Delete old signals
   */
  async deleteOldSignals(days: number = 30): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await this.tradingSignalModel.deleteMany({
        timestamp: { $lt: cutoffTime },
      });

      this.logger.log(`Deleted ${result.deletedCount} signals older than ${days} days`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error('Failed to delete old signals:', error);
      throw error;
    }
  }

  /**
   * Get high confidence signals
   */
  async getHighConfidenceSignals(
    minConfidence: number = 0.8,
    hours: number = 24
  ): Promise<TradingSignal[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const signals = await this.tradingSignalModel
        .find({
          confidence: { $gte: minConfidence },
          timestamp: { $gte: cutoffTime },
        })
        .sort({ confidence: -1, timestamp: -1 })
        .exec();

      this.logger.debug(`Found ${signals.length} high confidence signals (>=${minConfidence * 100}%)`);
      return signals;
    } catch (error) {
      this.logger.error('Failed to get high confidence signals:', error);
      throw error;
    }
  }

  /**
   * Update signal (for correction or additional metadata)
   */
  async updateSignal(id: string, updates: Partial<TradingSignal>): Promise<TradingSignal | null> {
    try {
      const updatedSignal = await this.tradingSignalModel
        .findByIdAndUpdate(id, updates, { new: true })
        .exec();

      if (updatedSignal) {
        this.logger.debug(`Updated signal ${id}`);
      } else {
        this.logger.warn(`Signal ${id} not found for update`);
      }

      return updatedSignal;
    } catch (error) {
      this.logger.error(`Failed to update signal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete signal
   */
  async deleteSignal(id: string): Promise<boolean> {
    try {
      const result = await this.tradingSignalModel.findByIdAndDelete(id).exec();
      
      if (result) {
        this.logger.debug(`Deleted signal ${id}`);
        return true;
      } else {
        this.logger.warn(`Signal ${id} not found for deletion`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to delete signal ${id}:`, error);
      throw error;
    }
  }
}
