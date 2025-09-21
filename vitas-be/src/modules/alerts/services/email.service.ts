import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { ITradingSignal } from '../../../common/interfaces/trading.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly enabled: boolean;
  private readonly from: string;
  private readonly to: string[];
  
  // Rate limiting
  private lastEmailTimes = new Map<string, Date>();
  private emailCount = 0;
  private lastHourReset = new Date();
  private dailySummarySent = false;
  private lastSummaryDate: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    this.enabled = this.configService.get('notifications.email.enabled') || false;
    this.from = this.configService.get('notifications.email.from') || '';
    this.to = this.configService.get('notifications.email.to') || [];
    
    if (this.enabled) {
      this.logger.log('Email service initialized with @nestjs-modules/mailer');
    }
  }

  /**
   * Send buy alert email
   */
  async sendBuyAlert(signals: ITradingSignal[]): Promise<boolean> {
    if (!this.enabled || signals.length === 0) {
      return false;
    }

    try {
      if (!this.checkRateLimit('buy_signal')) {
        return false;
      }

      const mailOptions: ISendMailOptions = {
        to: this.to,
        subject: `🟢 Trading Alert: ${signals.length} Buy Recommendations - ${new Date().toLocaleDateString()}`,
        template: 'buy-alert',
        context: {
          signals: signals.map(signal => ({
            ticker: signal.ticker,
            confidence: Math.round(signal.confidence * 100),
            entryPrice: signal.entryPrice.toLocaleString(),
            stopLoss: signal.stopLoss?.toLocaleString(),
            takeProfit: signal.takeProfit?.toLocaleString(),
            reason: signal.reason,
            timestamp: signal.timestamp.toLocaleString(),
          })),
          generatedAt: new Date().toLocaleString(),
        },
      };

      await this.mailerService.sendMail(mailOptions);
      this.updateRateLimit('buy_signal');
      this.logger.log(`Sent buy alert email for ${signals.length} signals`);
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send buy alert email:', error);
      return false;
    }
  }

  /**
   * Send sell alert email
   */
  async sendSellAlert(signals: ITradingSignal[]): Promise<boolean> {
    if (!this.enabled || signals.length === 0) {
      return false;
    }

    try {
      if (!this.checkRateLimit('sell_signal')) {
        return false;
      }

      const mailOptions: ISendMailOptions = {
        to: this.to,
        subject: `🔴 Trading Alert: ${signals.length} Sell Recommendations - ${new Date().toLocaleDateString()}`,
        template: 'sell-alert',
        context: {
          signals: signals.map(signal => ({
            ticker: signal.ticker,
            confidence: Math.round(signal.confidence * 100),
            entryPrice: signal.entryPrice.toLocaleString(),
            reason: signal.reason,
            timestamp: signal.timestamp.toLocaleString(),
          })),
          generatedAt: new Date().toLocaleString(),
        },
      };

      await this.mailerService.sendMail(mailOptions);
      this.updateRateLimit('sell_signal');
      this.logger.log(`Sent sell alert email for ${signals.length} signals`);
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send sell alert email:', error);
      return false;
    }
  }

  /**
   * Send risk warning email
   */
  async sendRiskWarning(signals: ITradingSignal[]): Promise<boolean> {
    if (!this.enabled || signals.length === 0) {
      return false;
    }

    try {
      if (!this.checkRateLimit('risk_warning')) {
        return false;
      }

      const mailOptions: ISendMailOptions = {
        to: this.to,
        subject: `⚠️ Risk Warning: ${signals.length} Alerts - ${new Date().toLocaleDateString()}`,
        template: 'risk-warning',
        context: {
          signals: signals.map(signal => ({
            ticker: signal.ticker,
            confidence: Math.round(signal.confidence * 100),
            entryPrice: signal.entryPrice.toLocaleString(),
            reason: signal.reason,
            timestamp: signal.timestamp.toLocaleString(),
          })),
          generatedAt: new Date().toLocaleString(),
        },
      };

      await this.mailerService.sendMail(mailOptions);
      this.updateRateLimit('risk_warning');
      this.logger.log(`Sent risk warning email for ${signals.length} signals`);
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send risk warning email:', error);
      return false;
    }
  }

  /**
   * Send daily summary email
   */
  async sendDailySummary(summaryData: any): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already sent today
      if (this.dailySummarySent && this.lastSummaryDate === today) {
        this.logger.debug('Daily summary already sent today');
        return false;
      }

      const mailOptions: ISendMailOptions = {
        to: this.to,
        subject: `📊 Daily Trading Summary - ${new Date().toLocaleDateString()}`,
        template: 'daily-summary',
        context: {
          ...summaryData,
          date: new Date().toLocaleDateString(),
          generatedAt: new Date().toLocaleString(),
        },
      };

      await this.mailerService.sendMail(mailOptions);
      this.dailySummarySent = true;
      this.lastSummaryDate = today;
      this.logger.log('Sent daily summary email');
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send daily summary email:', error);
      return false;
    }
  }

  /**
   * Send portfolio update email
   */
  async sendPortfolioUpdate(portfolioData: any): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      if (!this.checkRateLimit('portfolio_update')) {
        return false;
      }

      const mailOptions: ISendMailOptions = {
        to: this.to,
        subject: `💼 Portfolio Update - ${new Date().toLocaleDateString()}`,
        template: 'portfolio-update',
        context: {
          ...portfolioData,
          generatedAt: new Date().toLocaleString(),
        },
      };

      await this.mailerService.sendMail(mailOptions);
      this.updateRateLimit('portfolio_update');
      this.logger.log('Sent portfolio update email');
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send portfolio update email:', error);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const mailOptions: ISendMailOptions = {
        to: this.to,
        subject: '🧪 VITAS Trading System - Email Test',
        template: 'test-email',
        context: {
          generatedAt: new Date().toLocaleString(),
          smtpHost: this.configService.get('notifications.email.smtp.host'),
          smtpPort: this.configService.get('notifications.email.smtp.port'),
          smtpSecure: this.configService.get('notifications.email.smtp.secure'),
          from: this.from,
          to: this.to.join(', '),
        },
      };

      await this.mailerService.sendMail(mailOptions);
      this.logger.log('Test email sent successfully');
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send test email:', error);
      return false;
    }
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(alertType: string): boolean {
    const now = new Date();
    const debounceMinutes = this.configService.get('notifications.email.debounceMinutes');
    const maxEmailsPerHour = this.configService.get('notifications.email.maxEmailsPerHour');
    
    // Reset hourly counter
    if (now.getTime() - this.lastHourReset.getTime() > 60 * 60 * 1000) {
      this.emailCount = 0;
      this.lastHourReset = now;
    }
    
    // Check hourly limit
    if (this.emailCount >= maxEmailsPerHour) {
      return false;
    }
    
    // Check debounce time
    const lastEmailTime = this.lastEmailTimes.get(alertType);
    if (lastEmailTime) {
      const timeDiff = (now.getTime() - lastEmailTime.getTime()) / (1000 * 60);
      if (timeDiff < debounceMinutes) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Update rate limiting counters
   */
  private updateRateLimit(alertType: string): void {
    this.lastEmailTimes.set(alertType, new Date());
    this.emailCount++;
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.enabled) {
      return { success: false, message: 'Email notifications disabled' };
    }

    try {
      // Test connection by sending a test email
      const success = await this.sendTestEmail();
      
      if (success) {
        return { 
          success: true, 
          message: 'Test email sent successfully using @nestjs-modules/mailer' 
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to send test email' 
        };
      }
    } catch (error) {
      this.logger.error('Email test failed:', error);
      
      let errorMessage = `Email test failed: ${error.message}`;
      
      if (error.message.includes('wrong version number')) {
        errorMessage += '\n\n🔧 Troubleshooting tips:\n';
        errorMessage += '• Check if SMTP_SECURE should be "false" for port 587\n';
        errorMessage += '• Try SMTP_PORT=587 with SMTP_SECURE=false for STARTTLS\n';
        errorMessage += '• Try SMTP_PORT=465 with SMTP_SECURE=true for SSL\n';
        errorMessage += '• For Gmail: Use App Password instead of regular password';
      }
      
      if (error.code === 'EAUTH') {
        errorMessage += '\n\n🔐 Authentication issue:\n';
        errorMessage += '• Check username and password\n';
        errorMessage += '• For Gmail: Enable 2FA and use App Password\n';
        errorMessage += '• For Outlook: Use App Password';
      }
      
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Get service status
   */
  getStatus(): any {
    return {
      enabled: this.enabled,
      from: this.from,
      toCount: this.to?.length || 0,
      emailCount: this.emailCount,
      lastHourReset: this.lastHourReset,
      dailySummarySent: this.dailySummarySent,
      lastSummaryDate: this.lastSummaryDate,
      service: 'EmailService (@nestjs-modules/mailer)',
    };
  }

  /**
   * Reset daily summary flag (for new day)
   */
  resetDailySummaryFlag(): void {
    this.dailySummarySent = false;
    this.lastSummaryDate = null;
  }
}
