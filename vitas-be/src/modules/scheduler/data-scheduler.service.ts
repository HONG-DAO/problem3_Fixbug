import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataFetchService } from '../market-data/services/data-fetch.service';
import { FiinQuantDataService } from '../../infrastructure/external-services/fiinquant-data.service';
import { MarketDataService } from '../../infrastructure/database/market-data.service';
import { NotificationService } from '../notifications/services/notification.service';
import { Timeframe } from '../../common/constants/timeframe.constants';

@Injectable()
export class DataSchedulerService {
  private readonly logger = new Logger(DataSchedulerService.name);
  private allTickers: string[] = [];
  private lastFetchTime: Date | null = null;
  private isRunning = false;

  constructor(
    private readonly dataFetchService: DataFetchService,
    private readonly fiinQuantService: FiinQuantDataService,
    private readonly marketDataService: MarketDataService,
    private readonly notificationService: NotificationService,
  ) {
    this.initializeTickers();
  }

  /**
   * Initialize tickers list
   */
  private async initializeTickers(): Promise<void> {
    try {
      this.allTickers = await this.fiinQuantService.getAllTickers();
      this.logger.log(`Initialized with ${this.allTickers.length} tickers`);
    } catch (error) {
      this.logger.error('Failed to initialize tickers:', error);
      // Fallback to default tickers
      this.allTickers = [
        'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
        'LPB', 'MBB', 'MSN', 'MWG', 'PLX', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
        'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'
      ];
      this.logger.warn(`Using fallback tickers: ${this.allTickers.length} tickers`);
    }
  }

  /**
   * Check if current time is within trading hours (9:00 - 15:00) and weekday (Mon-Fri)
   */
  private isTradingTime(): boolean {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    const dayOfWeek = vietnamTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = vietnamTime.getHours();
    const minute = vietnamTime.getMinutes();
    
    // Check if it's weekday (Monday = 1, Friday = 5)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Check if it's trading hours (9:00 - 15:00)
    const isTradingHours = hour >= 9 && hour < 16;
    
    return isWeekday && isTradingHours;
  }

  private isTopOfHour(): boolean {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    const minute = vietnamTime.getMinutes();
    return minute === 0;
  }

  /**
   * Get next fetch time (next 5-minute interval)
   */
  private getNextFetchTime(): Date {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    const minute = vietnamTime.getMinutes();
    const nextMinute = Math.ceil(minute / 5) * 5;
    
    const nextTime = new Date(vietnamTime);
    nextTime.setMinutes(nextMinute, 0, 0);
    
    // If next time is next hour
    if (nextMinute >= 60) {
      nextTime.setHours(nextTime.getHours() + 1);
      nextTime.setMinutes(0, 0, 0);
    }
    
    return nextTime;
  }

  /**
   * Main scheduled task - runs every minute to check for fetch opportunities
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleDataFetch(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Previous fetch still running, skipping...');
      return;
    }

    if (!this.isTradingTime()) {
      this.logger.debug('Outside trading hours or not a weekday, skipping fetch');
      return;
    }

    // Chỉ chạy đầu giờ để khung 4h/1h đồng bộ, còn 15m sẽ gom bằng periods
    if (!this.isTopOfHour()) {
      this.logger.debug('Not top of the hour, skipping fetch');
      return;
    }

    // Check if we already fetched at this interval
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    if (this.lastFetchTime) {
      const timeDiff = vietnamTime.getTime() - this.lastFetchTime.getTime();
      if (timeDiff < 4 * 60 * 1000) { // Less than 4 minutes ago
        this.logger.debug('Already fetched recently, skipping...');
        return;
      }
    }

    await this.fetchAllTimeframesData();
  }

  /**
   * Fetch data for all timeframes and all tickers
   */
  private async fetchAllTimeframesData(): Promise<void> {
    this.isRunning = true;
    const startTime = new Date();
    
    try {
      this.logger.log(`Starting scheduled data fetch for ${this.allTickers.length} tickers...`);
      
      const timeframes = ['15m', '1h', '4h', '1d'];
      const results = {
        totalTickers: this.allTickers.length,
        timeframes: {},
        success: true,
        errors: []
      };

      // Repeat fetching 3 times per run to avoid missing data
      for (let attempt = 1; attempt <= 3; attempt++) {
        this.logger.log(`Attempt ${attempt}/3`);
        
        // Fetch data for each timeframe
        for (const timeframe of timeframes) {
          try {
            this.logger.log(`Fetching ${timeframe} data...`);
            
            const fetchResult = await this.dataFetchService.fetchAndSaveHistoricalData(
              this.allTickers,
              timeframe,
              100, // periods
              undefined, // fromDate
              undefined  // toDate
            );

            // Aggregate or set per timeframe result (latest attempt wins)
            results.timeframes[timeframe] = {
              success: fetchResult.success,
              totalTickers: fetchResult.totalTickers,
              successfulTickers: fetchResult.successfulTickers,
              failedTickers: fetchResult.failedTickers,
              totalDataPoints: (results.timeframes[timeframe]?.totalDataPoints || 0) + fetchResult.totalDataPoints,
              errors: [...(results.timeframes[timeframe]?.errors || []), ...(fetchResult.errors || [])]
            };

            this.logger.log(`${timeframe} data fetch completed: ${fetchResult.successfulTickers}/${fetchResult.totalTickers} tickers`);
            
          } catch (error) {
            this.logger.error(`Failed to fetch ${timeframe} data:`, error);
            results.timeframes[timeframe] = {
              success: false,
              error: error.message
            } as any;
            results.errors.push(`${timeframe}: ${error.message}` as never);
          }
        }

        // Short delay between attempts (e.g., 20s)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 20000));
        }
      }

      // Update last fetch time
      this.lastFetchTime = new Date();
      
      const duration = Date.now() - startTime.getTime();
      this.logger.log(`Scheduled data fetch completed in ${duration}ms`);
      
      // Log summary
      this.logSummary(results);

      // Send market analysis and notifications
      try {
        this.logger.log('Starting market analysis and notifications...');
        const notificationResult = await this.notificationService.sendMarketAnalysisAndSignals(this.allTickers);
        
        this.logger.log(`Market analysis completed: ${notificationResult.marketOverview.scenario.name}`);
        this.logger.log(`Notifications sent to ${notificationResult.notificationResults.length} channels`);
        
        // Log notification results
        notificationResult.notificationResults.forEach(result => {
          if (result.success) {
            this.logger.log(`  ${result.channel}: ${result.message}`);
          } else {
            this.logger.error(`  ${result.channel}: ${result.error}`);
          }
        });
        
      } catch (error) {
        this.logger.error('Failed to send market analysis and notifications:', error);
      }

    } catch (error) {
      this.logger.error('Scheduled data fetch failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Log fetch summary
   */
  private logSummary(results: any): void {
    const totalSuccessful = Object.values(results.timeframes).reduce((sum: number, tf: any) => {
      return sum + (tf.successfulTickers || 0);
    }, 0);
    
    const totalTickers = results.totalTickers * Object.keys(results.timeframes).length;
    
    this.logger.log(`📊 Fetch Summary: ${totalSuccessful}/${totalTickers} successful ticker-timeframe combinations`);
    
    // Log per timeframe results
    Object.entries(results.timeframes).forEach(([timeframe, result]: [string, any]) => {
      if (result.success) {
        this.logger.log(`  ${timeframe}: ${result.successfulTickers}/${result.totalTickers} tickers, ${result.totalDataPoints} data points`);
      } else {
        this.logger.error(`  ${timeframe}: FAILED - ${result.error}`);
      }
    });
  }

  /**
   * Manual trigger for data fetch (for testing)
   */
  async triggerManualFetch(): Promise<any> {
    if (this.isRunning) {
      return { success: false, message: 'Fetch already running' };
    }

    this.logger.log('Manual data fetch triggered');
    await this.fetchAllTimeframesData();
    
    return { success: true, message: 'Manual fetch completed' };
  }

  /**
   * Get scheduler status
   */
  getStatus(): any {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    return {
      isRunning: this.isRunning,
      isTradingTime: this.isTradingTime(),
      isTopOfHour: this.isTopOfHour(),
      currentTime: vietnamTime.toISOString(),
      nextFetchTime: this.getNextFetchTime().toISOString(),
      lastFetchTime: this.lastFetchTime?.toISOString() || null,
      totalTickers: this.allTickers.length,
      tickers: this.allTickers.slice(0, 10), // Show first 10 tickers
    };
  }

  /**
   * Update tickers list
   */
  async refreshTickers(): Promise<void> {
    this.logger.log('Refreshing tickers list...');
    await this.initializeTickers();
  }

  /**
   * Get next scheduled fetch time
   */
  getNextScheduledFetch(): Date {
    return this.getNextFetchTime();
  }

  /**
   * Sync 1-minute data every minute during trading hours
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async sync1mData(): Promise<void> {
    if (!this.isTradingTime()) {
      return;
    }

    try {
      this.logger.debug('Starting 1m data sync...');
      
      for (const ticker of this.allTickers.slice(0, 10)) { // Limit to first 10 tickers for 1m sync
        try {
          const results = await this.dataFetchService.fetchIncrementalData([ticker], Timeframe.ONE_MINUTE);
          this.logger.debug(`1m sync ${ticker}: +${results[0]?.newDataPoints ?? 0} bars`);          
        } catch (error) {
          this.logger.error(`1m sync failed for ${ticker}:`, error);
        }
      }
      
      this.logger.log('1m data sync completed');
    } catch (error) {
      this.logger.error('1m data sync failed:', error);
    }
  }
}
