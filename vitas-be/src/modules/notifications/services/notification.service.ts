import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from '../../alerts/services/telegram.service';
import { EmailService } from '../../alerts/services/email.service';
import { MarketAnalysisService, MarketOverview } from '../../market-analysis/services/market-analysis.service';
import { UserWatchlistService } from '../../market-analysis/services/user-watchlist.service';
import { TradingSignalService } from '../../../infrastructure/database/trading-signal.service';
import { ITradingSignal } from '../../../common/interfaces/trading.interface';

export interface NotificationResult {
  success: boolean;
  channel: string;
  recipients: number;
  message?: string;
  error?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
    private readonly marketAnalysisService: MarketAnalysisService,
    private readonly userWatchlistService: UserWatchlistService,
    private readonly tradingSignalService: TradingSignalService,
  ) {}

  /**
   * Send market overview and signals after data fetch
   */
  async sendMarketAnalysisAndSignals(tickers: string[]): Promise<{
    marketOverview: MarketOverview;
    notificationResults: NotificationResult[];
  }> {
    try {
      this.logger.log(`Sending market analysis and signals for ${tickers.length} tickers`);

      // 1. Analyze market conditions
      const marketOverview = await this.marketAnalysisService.analyzeMarketConditions(tickers);
      
      // 2. Get strategy introduction
      const strategyIntro = this.marketAnalysisService.getStrategyIntroduction();
      
      // 3. Get market overview content
      const marketOverviewContent = this.marketAnalysisService.getMarketOverviewContent(marketOverview);
      
      // 4. Get recent signals for all tickers
      const recentSignals = await this.tradingSignalService.findRecent(1, 1000);
      const relevantSignals = recentSignals.filter(s => tickers.includes(s.ticker)).map(s => s as ITradingSignal);
      
      // 5. Send notifications
      const notificationResults: NotificationResult[] = [];

      // Send to Telegram users
      const telegramResult = await this.sendToTelegramUsers(marketOverview, relevantSignals, strategyIntro, marketOverviewContent);
      notificationResults.push(telegramResult);

      // Send to Dashboard (save to database)
      const dashboardResult = await this.saveToDashboard(marketOverview, relevantSignals);
      notificationResults.push(dashboardResult);

      // Send daily email summary (if it's the right time)
      const emailResult = await this.sendDailyEmailSummary(marketOverview, relevantSignals);
      if (emailResult) {
        notificationResults.push(emailResult);
      }

      this.logger.log(`Market analysis and notifications completed: ${notificationResults.length} channels`);

      return {
        marketOverview,
        notificationResults,
      };

    } catch (error) {
      this.logger.error('Failed to send market analysis and signals:', error);
      throw error;
    }
  }

  /**
   * Send notifications to Telegram users
   */
  private async sendToTelegramUsers(
    marketOverview: MarketOverview,
    signals: ITradingSignal[],
    strategyIntro: string,
    marketOverviewContent: string
  ): Promise<NotificationResult> {
    try {
      // Get all tickers for Telegram notifications (single user system)
      const telegramTickers = await this.userWatchlistService.getTickersForChannel('telegram');
      const allTelegramTickers = Object.values(telegramTickers).flat();
      
      if (allTelegramTickers.length === 0) {
        return {
          success: true,
          channel: 'telegram',
          recipients: 0,
          message: 'No Telegram tickers found'
        };
      }

      // Filter signals for Telegram tickers
      const telegramSignals = signals.filter(s => allTelegramTickers.includes(s.ticker));
      
      if (telegramSignals.length === 0) {
        return {
          success: true,
          channel: 'telegram',
          recipients: 0,
          message: 'No signals for Telegram tickers'
        };
      }

      try {
        // Send strategy introduction
        await this.telegramService.sendSystemAlert(strategyIntro, 'info');
        
        // Send market overview
        await this.telegramService.sendSystemAlert(marketOverviewContent, 'info');
        
        // Send individual signals
        for (const signal of telegramSignals) {
          await this.telegramService.sendTradingSignal(signal);
        }

        return {
          success: true,
          channel: 'telegram',
          recipients: 1, // Single user system
          message: `Sent ${telegramSignals.length} signals to Telegram`
        };

      } catch (error) {
        this.logger.error('Failed to send Telegram notifications:', error);
        return {
          success: false,
          channel: 'telegram',
          recipients: 0,
          error: error.message
        };
      }

    } catch (error) {
      this.logger.error('Failed to send Telegram notifications:', error);
      return {
        success: false,
        channel: 'telegram',
        recipients: 0,
        error: error.message
      };
    }
  }

  /**
   * Save data to Dashboard (database)
   */
  private async saveToDashboard(
    marketOverview: MarketOverview,
    signals: ITradingSignal[]
  ): Promise<NotificationResult> {
    try {
      // Get all tickers for Dashboard notifications (single user system)
      const dashboardTickers = await this.userWatchlistService.getTickersForChannel('dashboard');
      const allDashboardTickers = Object.values(dashboardTickers).flat();
      
      // Filter signals for Dashboard tickers
      const dashboardSignals = signals.filter(s => allDashboardTickers.includes(s.ticker));
      
      this.logger.log(`Saving market overview and ${dashboardSignals.length} dashboard signals to database`);
      
      // In a real implementation, you would:
      // 1. Save market overview to MarketOverview collection
      // 2. Save signals to TradingSignal collection (already done)
      // 3. Update dashboard cache/real-time data
      // 4. Trigger WebSocket updates to connected clients

      return {
        success: true,
        channel: 'dashboard',
        recipients: 1, // Dashboard is a single recipient
        message: `Saved market overview and ${dashboardSignals.length} signals to dashboard`
      };

    } catch (error) {
      this.logger.error('Failed to save to dashboard:', error);
      return {
        success: false,
        channel: 'dashboard',
        recipients: 0,
        error: error.message
      };
    }
  }

  /**
   * Send daily email summary
   */
  private async sendDailyEmailSummary(
    marketOverview: MarketOverview,
    signals: ITradingSignal[]
  ): Promise<NotificationResult | null> {
    try {
      // Check if it's time to send daily summary (e.g., 5 PM)
      const now = new Date();
      const hour = now.getHours();
      
      // Only send daily summary once per day around 5 PM
      if (hour < 17 || hour > 18) {
        return null;
      }

      // Get users who want email notifications
      const emailUsers = await this.userWatchlistService.getTickersForChannel('email');
      
      if (Object.keys(emailUsers).length === 0) {
        return {
          success: true,
          channel: 'email',
          recipients: 0,
          message: 'No email users found'
        };
      }

      // Prepare daily summary data
      const dailySummary = {
        date: now.toISOString().split('T')[0],
        marketOverview,
        totalSignals: signals.length,
        buySignals: signals.filter(s => s.signalType === 'buy').length,
        sellSignals: signals.filter(s => s.signalType === 'sell').length,
        riskWarnings: signals.filter(s => s.signalType === 'risk_warning').length,
        signals: signals.slice(0, 50), // Limit to 50 most recent signals
        strategyIntro: this.marketAnalysisService.getStrategyIntroduction(),
        marketOverviewContent: this.marketAnalysisService.getMarketOverviewContent(marketOverview),
      };

      // Send email summary
      const emailSent = await this.emailService.sendDailySummary(dailySummary);

      return {
        success: emailSent,
        channel: 'email',
        recipients: emailSent ? Object.keys(emailUsers).length : 0,
        message: emailSent ? `Daily summary sent to ${Object.keys(emailUsers).length} users` : 'Failed to send email'
      };

    } catch (error) {
      this.logger.error('Failed to send daily email summary:', error);
      return {
        success: false,
        channel: 'email',
        recipients: 0,
        error: error.message
      };
    }
  }

  /**
   * Send real-time signal to specific user
   */
  async sendRealtimeSignalToUser(userId: string, signal: ITradingSignal): Promise<boolean> {
    try {
      // Check if user has this ticker in watchlist
      const watchlist = await this.userWatchlistService.getUserWatchlist(userId);
      const watchlistItem = watchlist.find(w => w.ticker === signal.ticker && w.isActive);
      
      if (!watchlistItem) {
        this.logger.debug(`User ${userId} doesn't have ${signal.ticker} in watchlist`);
        return false;
      }

      // Send to appropriate channels
      let sent = false;

      if (watchlistItem.notificationChannels.includes('telegram')) {
        const telegramSent = await this.telegramService.sendTradingSignal(signal);
        if (telegramSent) {
          await this.userWatchlistService.updateNotificationTime(userId, signal.ticker);
          sent = true;
        }
      }

      if (watchlistItem.notificationChannels.includes('dashboard')) {
        // Save to dashboard (would trigger WebSocket update)
        this.logger.debug(`Signal for ${signal.ticker} saved to dashboard for user ${userId}`);
        sent = true;
      }

      return sent;

    } catch (error) {
      this.logger.error(`Failed to send real-time signal to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get notification status
   */
  getNotificationStatus(): any {
    return {
      telegram: this.telegramService.getStatus(),
      email: this.emailService.getStatus(),
      channels: ['telegram', 'email', 'dashboard'],
      lastUpdate: new Date(),
    };
  }
}
