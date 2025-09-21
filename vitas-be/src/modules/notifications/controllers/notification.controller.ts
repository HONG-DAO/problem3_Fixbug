import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { BaseResponseDto } from '../../../common/dto/base.dto';

export class TestNotificationDto {
  tickers?: string[];
  userId?: string;
}

@ApiTags('Notifications')
@Controller('api/notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Test market analysis and notifications
   */
  @Post('test-market-analysis')
  @ApiOperation({ summary: 'Test market analysis and send notifications' })
  @ApiResponse({ status: 200, description: 'Market analysis and notifications sent successfully' })
  async testMarketAnalysis(@Body() dto: TestNotificationDto) {
    try {
      const tickers = dto.tickers || ['VCB', 'VIC', 'FPT', 'HPG', 'VNM'];
      
      this.logger.log(`Testing market analysis for ${tickers.length} tickers`);
      
      const result = await this.notificationService.sendMarketAnalysisAndSignals(tickers);
      
      return BaseResponseDto.success(result, 'Market analysis and notifications sent successfully');
    } catch (error) {
      this.logger.error('Failed to test market analysis:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Test real-time signal to user
   */
  @Post('test-realtime-signal/:userId')
  @ApiOperation({ summary: 'Test real-time signal to specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Real-time signal sent successfully' })
  async testRealtimeSignal(
    @Param('userId') userId: string,
    @Body() dto: { ticker: string; signalType: string; confidence: number; price: number }
  ) {
    try {
      // Create a mock signal
      const mockSignal = {
        ticker: dto.ticker,
        timestamp: new Date(),
        signalType: dto.signalType as 'buy' | 'sell' | 'risk_warning',
        confidence: dto.confidence,
        entryPrice: dto.price,
        reason: 'Test signal',
        timeframe: '4h',
        indicators: {
          rsi: 45,
          psar: dto.price * 0.95,
          psarTrend: 'up',
          engulfingPattern: 1,
          volumeAnomaly: true,
          priceVsPsar: true,
        }
      };

      const success = await this.notificationService.sendRealtimeSignalToUser(userId, mockSignal);
      
      return BaseResponseDto.success(
        { success, signal: mockSignal },
        success ? 'Real-time signal sent successfully' : 'Failed to send real-time signal'
      );
    } catch (error) {
      this.logger.error(`Failed to test real-time signal for user ${userId}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  /**
   * Get notification status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get notification system status' })
  @ApiResponse({ status: 200, description: 'Notification status retrieved successfully' })
  async getNotificationStatus() {
    try {
      const status = this.notificationService.getNotificationStatus();
      return BaseResponseDto.success(status, 'Notification status retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get notification status:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}

