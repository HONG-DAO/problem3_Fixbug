import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { MarketAnalysisService, MarketOverview } from '../../market-analysis/services/market-analysis.service';
import { UserWatchlistService } from '../../market-analysis/services/user-watchlist.service';
import { TradingSignalService } from '../../../infrastructure/database/trading-signal.service';
import { MarketDataService } from '../../../infrastructure/database/market-data.service';
import { BaseResponseDto } from '../../../common/dto/base.dto';

export class AddToWatchlistDto {
  @ApiProperty({ 
    description: 'Stock ticker symbol to add to watchlist', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsString()
  ticker: string;

  @ApiProperty({ 
    description: 'Notification channels for this ticker', 
    example: ['telegram', 'dashboard'],
    type: [String],
    enum: ['telegram', 'dashboard', 'email']
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['telegram', 'dashboard', 'email'], { each: true })
  notificationChannels?: string[];

  @ApiProperty({ 
    description: 'User preferences for this ticker',
    example: {
      minConfidence: 0.8,
      signalTypes: ['buy', 'sell'],
      timeframes: ['1h', '1d']
    }
  })
  @IsOptional()
  preferences?: any;
}

export class UpdatePreferencesDto {
  @ApiProperty({ 
    description: 'Updated preferences for the ticker',
    example: {
      minConfidence: 0.9,
      signalTypes: ['buy', 'sell', 'risk_warning'],
      timeframes: ['1h', '1d', '4h']
    }
  })
  preferences: any;
}

@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly marketAnalysisService: MarketAnalysisService,
    private readonly userWatchlistService: UserWatchlistService,
    private readonly tradingSignalService: TradingSignalService,
    private readonly marketDataService: MarketDataService,
  ) {}

  /**
   * Get current market overview
   */
  @Get('market-overview')
  @ApiOperation({ summary: 'Get current market overview and scenario' })
  @ApiResponse({ status: 200, description: 'Market overview retrieved successfully' })
  async getMarketOverview(@Query('tickers') tickers?: string) {
    try {
      const tickerList = tickers ? tickers.split(',') : await this.userWatchlistService.getAllActiveTickers();
      
      if (tickerList.length === 0) {
        return BaseResponseDto.success(null, 'No tickers to analyze');
      }

      const overview = await this.marketAnalysisService.analyzeMarketConditions(tickerList);
      
      return BaseResponseDto.success(overview, 'Market overview retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get market overview:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get strategy introduction
   */
  @Get('strategy-introduction')
  @ApiOperation({ summary: 'Get strategy introduction content' })
  @ApiResponse({ status: 200, description: 'Strategy introduction retrieved successfully' })
  async getStrategyIntroduction() {
    try {
      const content = this.marketAnalysisService.getStrategyIntroduction();
      return BaseResponseDto.success({ content }, 'Strategy introduction retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get strategy introduction:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get market overview content for notifications
   */
  @Get('market-overview-content')
  @ApiOperation({ summary: 'Get formatted market overview content' })
  @ApiQuery({ name: 'tickers', required: false, description: 'Comma-separated list of tickers' })
  @ApiResponse({ status: 200, description: 'Market overview content retrieved successfully' })
  async getMarketOverviewContent(@Query('tickers') tickers?: string) {
    try {
      const tickerList = tickers ? tickers.split(',') : await this.userWatchlistService.getAllActiveTickers();
      
      if (tickerList.length === 0) {
        return BaseResponseDto.success({ content: 'No tickers to analyze' }, 'No data available');
      }

      const overview = await this.marketAnalysisService.analyzeMarketConditions(tickerList);
      const content = this.marketAnalysisService.getMarketOverviewContent(overview);
      
      return BaseResponseDto.success({ content, overview }, 'Market overview content retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get market overview content:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get real-time signals for dashboard watchlist
   */
  @Get('signals')
  @ApiOperation({ summary: 'Get real-time signals for dashboard watchlist' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours to look back', example: '24' })
  @ApiResponse({ status: 200, description: 'Signals retrieved successfully' })
  async getDashboardSignals(@Query('hours') hours: string = '24') {
    try {
      // Get dashboard tickers (single user system)
      const dashboardTickers = await this.userWatchlistService.getTickersForChannel('dashboard');
      const allDashboardTickers = Object.values(dashboardTickers).flat();
      
      if (allDashboardTickers.length === 0) {
        return BaseResponseDto.success({ signals: [], watchlist: [] }, 'No tickers in dashboard watchlist');
      }

      // Get today's signals only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const signals = await this.tradingSignalService.findMany({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        limit: 1000
      });

      const dashboardSignals = signals.signals.filter(signal => 
        allDashboardTickers.includes(signal.ticker)
      );

      // Group signals by ticker
      const signalsByTicker = dashboardSignals.reduce((acc, signal) => {
        if (!acc[signal.ticker]) {
          acc[signal.ticker] = [];
        }
        acc[signal.ticker].push(signal);
        return acc;
      }, {});

      return BaseResponseDto.success({
        signals: dashboardSignals,
        signalsByTicker,
        watchlist: allDashboardTickers,
        totalSignals: dashboardSignals.length,
        tickersWithSignals: Object.keys(signalsByTicker).length
      }, 'Dashboard signals retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get dashboard signals:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get OHLCV data for charting
   */
  @Get('chart-data/:ticker')
  @ApiOperation({ summary: 'Get OHLCV data for charting' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Data timeframe', example: '4h' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of data points', example: '100' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  async getChartData(
    @Param('ticker') ticker: string,
    @Query('timeframe') timeframe: string = '4h',
    @Query('limit') limit: string = '100'
  ) {
    try {
      const ohlcvData = await this.marketDataService.getOHLCVData(
        ticker,
        timeframe,
        parseInt(limit)
      );

      return BaseResponseDto.success({
        ticker,
        timeframe,
        data: ohlcvData,
        count: ohlcvData.length
      }, 'Chart data retrieved successfully');
    } catch (error) {
      this.logger.error(`Failed to get chart data for ${ticker}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Add ticker to watchlist
   */
  @Post('watchlist')
  @ApiOperation({ 
    summary: 'Add ticker to watchlist',
    description: 'Add a single ticker to user watchlist with notification preferences'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ticker added to watchlist successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Ticker added to watchlist successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'default' },
            ticker: { type: 'string', example: 'VCB' },
            notificationChannels: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['telegram', 'dashboard']
            },
            isActive: { type: 'boolean', example: true },
            addedAt: { type: 'string', format: 'date-time', example: '2024-09-20T14:15:00.000Z' },
            preferences: {
              type: 'object',
              properties: {
                minConfidence: { type: 'number', example: 0.8 },
                signalTypes: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['buy', 'sell']
                },
                timeframes: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['1h', '1d']
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        data: { type: 'null' }
      }
    }
  })
  async addToWatchlist(@Body() dto: AddToWatchlistDto) {
    try {
      const watchlistItem = await this.userWatchlistService.addToWatchlist(
        'default', // Single user system
        dto.ticker,
        dto.notificationChannels || ['telegram', 'dashboard'],
        dto.preferences
      );

      return BaseResponseDto.success(watchlistItem, 'Ticker added to watchlist successfully');
    } catch (error) {
      this.logger.error('Failed to add ticker to watchlist:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Remove ticker from watchlist
   */
  @Post('watchlist/remove')
  @ApiOperation({ 
    summary: 'Remove ticker from watchlist',
    description: 'Remove a ticker from user watchlist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ticker removed from watchlist successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Ticker removed from watchlist successfully' },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            ticker: { type: 'string', example: 'VCB' }
          }
        }
      }
    }
  })
  async removeFromWatchlist(@Body() dto: { ticker: string }) {
    try {
      const success = await this.userWatchlistService.removeFromWatchlist('default', dto.ticker);
      
      return BaseResponseDto.success(
        { success, ticker: dto.ticker },
        success ? 'Ticker removed from watchlist successfully' : 'Ticker not found in watchlist'
      );
    } catch (error) {
      this.logger.error('Failed to remove ticker from watchlist:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get watchlist
   */
  @Get('watchlist')
  @ApiOperation({ 
    summary: 'Get watchlist',
    description: 'Retrieve user watchlist with all tickers and their preferences'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Watchlist retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Watchlist retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            watchlist: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string', example: 'default' },
                  ticker: { type: 'string', example: 'VCB' },
                  notificationChannels: { 
                    type: 'array', 
                    items: { type: 'string' },
                    example: ['telegram', 'dashboard']
                  },
                  isActive: { type: 'boolean', example: true },
                  addedAt: { type: 'string', format: 'date-time', example: '2024-09-20T14:15:00.000Z' },
                  preferences: {
                    type: 'object',
                    properties: {
                      minConfidence: { type: 'number', example: 0.8 },
                      signalTypes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        example: ['buy', 'sell']
                      },
                      timeframes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        example: ['1h', '1d']
                      }
                    }
                  }
                }
              }
            },
            count: { type: 'number', example: 2 }
          }
        }
      }
    }
  })
  async getWatchlist() {
    try {
      const watchlist = await this.userWatchlistService.getUserWatchlist('default');
      
      return BaseResponseDto.success({
        watchlist,
        count: watchlist.length
      }, 'Watchlist retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get watchlist:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Update watchlist preferences
   */
  @Post('watchlist/preferences')
  @ApiOperation({ 
    summary: 'Update watchlist preferences',
    description: 'Update notification preferences for a specific ticker in watchlist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Preferences updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Preferences updated successfully' },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            ticker: { type: 'string', example: 'VCB' }
          }
        }
      }
    }
  })
  async updatePreferences(@Body() dto: UpdatePreferencesDto & { ticker: string }) {
    try {
      const success = await this.userWatchlistService.updatePreferences(
        'default',
        dto.ticker,
        dto.preferences
      );

      return BaseResponseDto.success(
        { success, ticker: dto.ticker },
        success ? 'Preferences updated successfully' : 'Ticker not found in watchlist'
      );
    } catch (error) {
      this.logger.error('Failed to update preferences:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get watchlist statistics
   */
  @Get('watchlist-stats')
  @ApiOperation({ 
    summary: 'Get watchlist statistics',
    description: 'Get comprehensive statistics about user watchlist usage'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Watchlist statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Watchlist statistics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 1 },
            totalTickers: { type: 'number', example: 4 },
            channelStats: {
              type: 'object',
              properties: {
                telegram: { type: 'number', example: 3 },
                dashboard: { type: 'number', example: 2 },
                email: { type: 'number', example: 1 }
              }
            },
            topTickers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ticker: { type: 'string', example: 'VCB' },
                  count: { type: 'number', example: 1 }
                }
              }
            }
          }
        }
      }
    }
  })
  async getWatchlistStats() {
    try {
      const stats = await this.userWatchlistService.getWatchlistStats();
      
      return BaseResponseDto.success(stats, 'Watchlist statistics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get watchlist stats:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get recent market data for multiple tickers
   */
  @Get('market-data')
  @ApiOperation({ summary: 'Get recent market data for multiple tickers' })
  @ApiQuery({ name: 'tickers', required: true, description: 'Comma-separated list of tickers' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Data timeframe', example: '4h' })
  @ApiResponse({ status: 200, description: 'Market data retrieved successfully' })
  async getMarketData(
    @Query('tickers') tickers: string,
    @Query('timeframe') timeframe: string = '4h'
  ) {
    try {
      const tickerList = tickers.split(',');
      const marketData = await this.marketDataService.getLatestDataForTickers(tickerList, timeframe);
      
      return BaseResponseDto.success({
        tickers: tickerList,
        timeframe,
        data: marketData,
        count: Object.keys(marketData).length
      }, 'Market data retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get market data:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}
