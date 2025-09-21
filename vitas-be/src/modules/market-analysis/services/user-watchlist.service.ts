import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserWatchlist, UserWatchlistDocument } from '../../../schemas/user-watchlist.schema';

export interface WatchlistItem {
  ticker: string;
  notificationChannels: string[];
  isActive: boolean;
  addedAt: Date;
  lastNotificationAt?: Date;
  preferences?: {
    minConfidence?: number;
    signalTypes?: string[];
    timeframes?: string[];
  };
}

@Injectable()
export class UserWatchlistService {
  private readonly logger = new Logger(UserWatchlistService.name);

  constructor(
    @InjectModel(UserWatchlist.name)
    private readonly watchlistModel: Model<UserWatchlistDocument>,
  ) {}

  /**
   * Add ticker to user's watchlist
   */
  async addToWatchlist(
    userId: string,
    ticker: string,
    notificationChannels: string[] = ['telegram', 'dashboard'],
    preferences?: any
  ): Promise<UserWatchlist> {
    try {
      // Check if already exists
      const existing = await this.watchlistModel.findOne({ userId, ticker });
      if (existing) {
        // Update existing
        existing.notificationChannels = notificationChannels;
        existing.isActive = true;
        existing.preferences = preferences;
        return await existing.save();
      }

      const watchlistItem = new this.watchlistModel({
        userId,
        ticker,
        notificationChannels,
        isActive: true,
        preferences,
      });

      const saved = await watchlistItem.save();
      this.logger.log(`Added ${ticker} to watchlist for user ${userId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to add ${ticker} to watchlist:`, error);
      throw error;
    }
  }

  /**
   * Remove ticker from user's watchlist
   */
  async removeFromWatchlist(userId: string, ticker: string): Promise<boolean> {
    try {
      const result = await this.watchlistModel.deleteOne({ userId, ticker });
      this.logger.log(`Removed ${ticker} from watchlist for user ${userId}`);
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to remove ${ticker} from watchlist:`, error);
      throw error;
    }
  }

  /**
   * Get user's watchlist
   */
  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      const items = await this.watchlistModel
        .find({ userId, isActive: true })
        .sort({ addedAt: -1 })
        .exec();

      return items.map(item => ({
        ticker: item.ticker,
        notificationChannels: item.notificationChannels,
        isActive: item.isActive,
        addedAt: item.addedAt,
        lastNotificationAt: item.lastNotificationAt,
        preferences: item.preferences,
      }));
    } catch (error) {
      this.logger.error(`Failed to get watchlist for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get tickers for specific notification channel
   */
  async getTickersForChannel(channel: string): Promise<{ [userId: string]: string[] }> {
    try {
      const items = await this.watchlistModel
        .find({ 
          isActive: true,
          notificationChannels: channel 
        })
        .exec();

      const result: { [userId: string]: string[] } = {};
      
      for (const item of items) {
        if (!result[item.userId]) {
          result[item.userId] = [];
        }
        result[item.userId].push(item.ticker);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get tickers for channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Get all active tickers across all users
   */
  async getAllActiveTickers(): Promise<string[]> {
    try {
      const items = await this.watchlistModel
        .find({ isActive: true })
        .distinct('ticker')
        .exec();

      return items;
    } catch (error) {
      this.logger.error('Failed to get all active tickers:', error);
      throw error;
    }
  }

  /**
   * Update notification timestamp
   */
  async updateNotificationTime(userId: string, ticker: string): Promise<void> {
    try {
      await this.watchlistModel.updateOne(
        { userId, ticker },
        { lastNotificationAt: new Date() }
      );
    } catch (error) {
      this.logger.error(`Failed to update notification time for ${ticker}:`, error);
    }
  }

  /**
   * Update watchlist preferences
   */
  async updatePreferences(
    userId: string,
    ticker: string,
    preferences: any
  ): Promise<boolean> {
    try {
      const result = await this.watchlistModel.updateOne(
        { userId, ticker },
        { preferences }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to update preferences for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get watchlist statistics
   */
  async getWatchlistStats(): Promise<{
    totalUsers: number;
    totalTickers: number;
    channelDistribution: { [channel: string]: number };
    topTickers: Array<{ ticker: string; count: number }>;
  }> {
    try {
      const totalUsers = await this.watchlistModel.distinct('userId').then(users => users.length);
      const totalTickers = await this.watchlistModel.distinct('ticker').then(tickers => tickers.length);

      // Channel distribution
      const channelStats = await this.watchlistModel.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$notificationChannels' },
        { $group: { _id: '$notificationChannels', count: { $sum: 1 } } }
      ]);

      const channelDistribution: { [channel: string]: number } = {};
      channelStats.forEach(stat => {
        channelDistribution[stat._id] = stat.count;
      });

      // Top tickers
      const topTickers = await this.watchlistModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$ticker', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      return {
        totalUsers,
        totalTickers,
        channelDistribution,
        topTickers: topTickers.map(item => ({
          ticker: item._id,
          count: item.count
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get watchlist stats:', error);
      throw error;
    }
  }
}

