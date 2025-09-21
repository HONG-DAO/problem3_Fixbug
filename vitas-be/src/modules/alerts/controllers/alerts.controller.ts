import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TelegramService } from '../services/telegram.service';
import { EmailService } from '../services/email.service';

@ApiTags('Alerts')
@Controller('api/alerts')
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get notification services status
   */
  @Get('status')
  async getStatus() {
    try {
      const telegramStatus = this.telegramService.getStatus();
      const emailStatus = this.emailService.getStatus();

      return {
        success: true,
        telegram: telegramStatus,
        email: emailStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get alerts status:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Test Telegram connection
   */
  @Post('test-telegram')
  async testTelegram() {
    try {
      const result = await this.telegramService.testConnection();
      
      return {
        success: result.success,
        message: result.message,
        service: 'telegram',
      };
    } catch (error) {
      this.logger.error('Telegram test failed:', error);
      return {
        success: false,
        message: error.message,
        service: 'telegram',
      };
    }
  }

  /**
   * Test Email connection
   */
  @Post('test-email')
  async testEmail() {
    try {
      const result = await this.emailService.testConnection();
      
      return {
        success: result.success,
        message: result.message,
        service: 'email',
      };
    } catch (error) {
      this.logger.error('Email test failed:', error);
      return {
        success: false,
        message: error.message,
        service: 'email',
      };
    }
  }

  /**
   * Send test system alert
   */
  @Post('test-system-alert')
  async sendTestSystemAlert(@Body() body: { 
    message?: string; 
    alertType?: 'info' | 'warning' | 'error'; 
    sendTelegram?: boolean;
  } = {}) {
    try {
      const { 
        message = 'This is a test system alert', 
        alertType = 'info',
        sendTelegram = true
      } = body || {};

      const results = {
        telegram: { success: false, message: 'Not attempted' },
      };

      if (sendTelegram) {
        const telegramResult = await this.telegramService.sendSystemAlert(message, alertType);
        results.telegram = {
          success: telegramResult,
          message: telegramResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      return {
        success: true,
        message: 'Test alert sent',
        results,
      };
    } catch (error) {
      this.logger.error('Failed to send test system alert:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Send test trading signal
   */
  @Post('test-trading-signal')
  async sendTestTradingSignal(@Body() body: {
    ticker?: string;
    signalType?: 'buy' | 'sell' | 'risk_warning';
    confidence?: number;
    price?: number;
    sendTelegram?: boolean;
    sendEmail?: boolean;
  } = {}) {
    try {
      const {
        ticker = 'VIC',
        signalType = 'buy',
        confidence = 0.85,
        price = 50000,
        sendTelegram = true,
        sendEmail = false,
      } = body || {};

      // Create test signal
      const testSignal = {
        ticker,
        timestamp: new Date(),
        signalType,
        confidence,
        entryPrice: price,
        stopLoss: signalType === 'buy' ? price * 0.92 : price * 1.08,
        takeProfit: signalType === 'buy' ? price * 1.15 : price * 0.85,
        reason: 'Test signal generated from API',
        indicators: {
          rsi: 35,
          psarTrend: 'up',
          engulfingPattern: 1,
          volumeAnomaly: true,
          priceVsPsar: true,
        },
      };

      const results = {
        telegram: { success: false, message: 'Not attempted' },
        email: { success: false, message: 'Not attempted' },
      };

      if (sendTelegram) {
        const telegramResult = await this.telegramService.sendTradingSignal(testSignal);
        results.telegram = {
          success: telegramResult,
          message: telegramResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      if (sendEmail) {
        let emailResult = false;
        if (signalType === 'buy') {
          emailResult = await this.emailService.sendBuyAlert([testSignal]);
        } else if (signalType === 'sell') {
          emailResult = await this.emailService.sendSellAlert([testSignal]);
        } else {
          emailResult = await this.emailService.sendRiskWarning([testSignal]);
        }
        
        results.email = {
          success: emailResult,
          message: emailResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      return {
        success: true,
        message: 'Test trading signal sent',
        testSignal,
        results,
      };
    } catch (error) {
      this.logger.error('Failed to send test trading signal:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Send test daily summary
   */
  @Post('test-daily-summary')
  async sendTestDailySummary(@Body() body: { 
    sendTelegram?: boolean; 
    sendEmail?: boolean; 
  } = {}) {
    try {
      const { sendTelegram = true, sendEmail = true } = body || {};

      // Create test summary data
      const summaryData = {
        totalAnalyzed: 50,
        buySignals: 8,
        sellSignals: 5,
        riskAlerts: 2,
        avgBuyConfidence: 0.78,
        avgSellConfidence: 0.72,
        performance: {
          avgTime: 1.25,
          updateCount: 120,
          errorCount: 2,
        },
      };

      const results = {
        telegram: { success: false, message: 'Not attempted' },
        email: { success: false, message: 'Not attempted' },
      };

      if (sendTelegram) {
        const telegramResult = await this.telegramService.sendDailySummary(summaryData);
        results.telegram = {
          success: telegramResult,
          message: telegramResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      if (sendEmail) {
        const emailResult = await this.emailService.sendDailySummary(summaryData);
        results.email = {
          success: emailResult,
          message: emailResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      return {
        success: true,
        message: 'Test daily summary sent',
        summaryData,
        results,
      };
    } catch (error) {
      this.logger.error('Failed to send test daily summary:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Send test portfolio update
   */
  @Post('test-portfolio-update')
  async sendTestPortfolioUpdate(@Body() body: { 
    sendTelegram?: boolean; 
    sendEmail?: boolean; 
  } = {}) {
    try {
      const { sendTelegram = true, sendEmail = true } = body || {};

      // Create test portfolio data
      const portfolioData = {
        portfolioValue: 1000000000, // 1B VND
        activePositions: 6,
        maxPositions: 10,
        dailyPnl: 25000000, // 25M VND
        warnings: [
          'High concentration in banking sector',
          'Position utilization at 60%',
        ],
      };

      const results = {
        telegram: { success: false, message: 'Not attempted' },
        email: { success: false, message: 'Not attempted' },
      };

      if (sendTelegram) {
        const telegramResult = await this.telegramService.sendPortfolioUpdate(portfolioData);
        results.telegram = {
          success: telegramResult,
          message: telegramResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      if (sendEmail) {
        const emailResult = await this.emailService.sendPortfolioUpdate(portfolioData);
        results.email = {
          success: emailResult,
          message: emailResult ? 'Sent successfully' : 'Failed to send',
        };
      }

      return {
        success: true,
        message: 'Test portfolio update sent',
        portfolioData,
        results,
      };
    } catch (error) {
      this.logger.error('Failed to send test portfolio update:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Reset email daily summary flag
   */
  @Post('reset-email-flags')
  async resetEmailFlags() {
    try {
      this.emailService.resetDailySummaryFlag();
      
      return {
        success: true,
        message: 'Email flags reset successfully',
      };
    } catch (error) {
      this.logger.error('Failed to reset email flags:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
