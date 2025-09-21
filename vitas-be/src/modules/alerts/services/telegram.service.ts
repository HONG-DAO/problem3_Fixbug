import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITradingSignal } from '../../../common/interfaces/trading.interface';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;
  private readonly chatId: string;
  private readonly enabled: boolean;
  
  // Rate limiting
  private lastAlertTimes = new Map<string, Date>();
  private messageCount = 0;
  private lastHourReset = new Date();

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get('notifications.telegram.enabled') || false;
    this.chatId = this.configService.get('notifications.telegram.chatId') || '';
    
    if (this.enabled) {
      this.initializeBot();
    }
  }

  private initializeBot(): void {
    try {
      const token = this.configService.get('notifications.telegram.botToken');
      
      if (!token) {
        this.logger.error('Telegram bot token not provided');
        return;
      }

      this.bot = new TelegramBot(token, { polling: false });
      
      this.logger.log('Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  /**
   * Send trading signal notification
   */
  async sendTradingSignal(signal: ITradingSignal): Promise<boolean> {
    if (!this.enabled || !this.bot || !this.chatId) {
      return false;
    }

    try {
      // Check rate limiting
      if (!this.checkRateLimit(signal.signalType)) {
        this.logger.debug(`Rate limit exceeded for ${signal.signalType} signal`);
        return false;
      }

      const message = this.formatSignalMessage(signal);
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      this.updateRateLimit(signal.signalType);
      this.logger.debug(`Sent ${signal.signalType} signal for ${signal.ticker}`);
      
      return true;

    } catch (error) {
      this.logger.error('Failed to send Telegram signal:', error);
      return false;
    }
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(message: string, alertType: 'info' | 'warning' | 'error' = 'info'): Promise<boolean> {
    if (!this.enabled || !this.bot || !this.chatId) {
      return false;
    }

    try {
      const emoji = alertType === 'error' ? '🚨' : alertType === 'warning' ? '⚠️' : 'ℹ️';
      const formattedMessage = `${emoji} *System Alert*\n\n${message}`;

      await this.bot.sendMessage(this.chatId, formattedMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      this.logger.debug(`Sent system alert: ${alertType}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to send system alert:', error);
      return false;
    }
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(summaryData: any): Promise<boolean> {
    if (!this.enabled || !this.bot || !this.chatId) {
      return false;
    }

    try {
      const message = this.formatDailySummary(summaryData);
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      this.logger.log('Sent daily summary');
      return true;

    } catch (error) {
      this.logger.error('Failed to send daily summary:', error);
      return false;
    }
  }

  /**
   * Send portfolio update
   */
  async sendPortfolioUpdate(portfolioData: any): Promise<boolean> {
    if (!this.enabled || !this.bot || !this.chatId) {
      return false;
    }

    try {
      const message = this.formatPortfolioUpdate(portfolioData);
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      this.logger.log('Sent portfolio update');
      return true;

    } catch (error) {
      this.logger.error('Failed to send portfolio update:', error);
      return false;
    }
  }

  /**
   * Format trading signal message
   */
  private formatSignalMessage(signal: ITradingSignal): string {
    const emoji = signal.signalType === 'buy' ? '🟢' : signal.signalType === 'sell' ? '🔴' : '🟠';
    const action = signal.signalType.toUpperCase();
    const confidence = Math.round(signal.confidence * 100);
    
    let message = `${emoji} *${action} SIGNAL*\n\n`;
    message += `📈 *Ticker:* ${signal.ticker}\n`;
    message += `💰 *Price:* ${signal.entryPrice.toLocaleString()} VND\n`;
    message += `📊 *Confidence:* ${confidence}%\n`;
    message += `🕐 *Time:* ${signal.timestamp.toLocaleString()}\n`;
    
    if (signal.stopLoss) {
      message += `🛑 *Stop Loss:* ${signal.stopLoss.toLocaleString()} VND\n`;
    }
    
    if (signal.takeProfit) {
      message += `🎯 *Take Profit:* ${signal.takeProfit.toLocaleString()} VND\n`;
    }
    
    message += `\n💡 *Reason:* ${signal.reason}\n`;
    
    if (signal.indicators) {
      message += `\n📊 *Indicators:*\n`;
      if (signal.indicators.rsi) {
        message += `• RSI: ${signal.indicators.rsi.toFixed(1)}\n`;
      }
      if (signal.indicators.psarTrend) {
        message += `• PSAR: ${signal.indicators.psarTrend}\n`;
      }
      if (signal.indicators.engulfingPattern) {
        const pattern = signal.indicators.engulfingPattern === 1 ? 'Bullish' : 'Bearish';
        message += `• Engulfing: ${pattern}\n`;
      }
      if (signal.indicators.volumeAnomaly) {
        message += `• Volume: High\n`;
      }
    }
    
    return message;
  }

  /**
   * Format daily summary message
   */
  private formatDailySummary(data: any): string {
    const date = new Date().toLocaleDateString();
    
    let message = `📊 *Daily Trading Summary*\n`;
    message += `📅 ${date}\n\n`;
    
    message += `🎯 *Signal Statistics:*\n`;
    message += `• Total Analyzed: ${data.totalAnalyzed || 0}\n`;
    message += `• Buy Signals: ${data.buySignals || 0}\n`;
    message += `• Sell Signals: ${data.sellSignals || 0}\n`;
    message += `• Risk Alerts: ${data.riskAlerts || 0}\n\n`;
    
    if (data.avgBuyConfidence) {
      message += `📈 *Average Confidence:*\n`;
      message += `• Buy: ${Math.round(data.avgBuyConfidence * 100)}%\n`;
      message += `• Sell: ${Math.round(data.avgSellConfidence * 100)}%\n\n`;
    }
    
    if (data.performance) {
      message += `⚡ *Performance:*\n`;
      message += `• Avg Processing: ${data.performance.avgTime?.toFixed(2)}s\n`;
      message += `• Updates: ${data.performance.updateCount || 0}\n`;
      message += `• Errors: ${data.performance.errorCount || 0}\n`;
    }
    
    return message;
  }

  /**
   * Format portfolio update message
   */
  private formatPortfolioUpdate(data: any): string {
    let message = `💼 *Portfolio Update*\n\n`;
    
    if (data.portfolioValue) {
      message += `💰 *Total Value:* ${data.portfolioValue.toLocaleString()} VND\n`;
    }
    
    if (data.activePositions !== undefined) {
      message += `📊 *Positions:* ${data.activePositions}/${data.maxPositions || 10}\n`;
    }
    
    if (data.dailyPnl !== undefined) {
      const pnlEmoji = data.dailyPnl >= 0 ? '📈' : '📉';
      message += `${pnlEmoji} *Daily P&L:* ${data.dailyPnl.toLocaleString()} VND\n`;
    }
    
    if (data.warnings && data.warnings.length > 0) {
      message += `\n⚠️ *Risk Warnings:*\n`;
      data.warnings.forEach((warning: string) => {
        message += `• ${warning}\n`;
      });
    }
    
    message += `\n🕐 *Updated:* ${new Date().toLocaleString()}`;
    
    return message;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(signalType: string): boolean {
    const now = new Date();
    const debounceMinutes = this.configService.get('notifications.telegram.debounceMinutes');
    const maxAlertsPerHour = this.configService.get('notifications.telegram.maxAlertsPerHour');
    
    // Reset hourly counter
    if (now.getTime() - this.lastHourReset.getTime() > 60 * 60 * 1000) {
      this.messageCount = 0;
      this.lastHourReset = now;
    }
    
    // Check hourly limit
    if (this.messageCount >= maxAlertsPerHour) {
      return false;
    }
    
    // Check debounce time for same signal type
    const lastAlertTime = this.lastAlertTimes.get(signalType);
    if (lastAlertTime) {
      const timeDiff = (now.getTime() - lastAlertTime.getTime()) / (1000 * 60);
      if (timeDiff < debounceMinutes) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Update rate limiting counters
   */
  private updateRateLimit(signalType: string): void {
    this.lastAlertTimes.set(signalType, new Date());
    this.messageCount++;
  }

  /**
   * Test Telegram connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.enabled) {
      return { success: false, message: 'Telegram notifications disabled' };
    }

    if (!this.bot || !this.chatId) {
      return { success: false, message: 'Telegram bot not configured' };
    }

    try {
      await this.bot.sendMessage(this.chatId, '🧪 *Test Message*\n\nTelegram connection successful!', {
        parse_mode: 'Markdown',
      });

      return { success: true, message: 'Test message sent successfully' };
    } catch (error) {
      return { success: false, message: `Failed to send test message: ${error.message}` };
    }
  }

  /**
   * Get service status
   */
  getStatus(): any {
    return {
      enabled: this.enabled,
      connected: !!this.bot,
      chatId: this.chatId ? `***${this.chatId.slice(-4)}` : null,
      messageCount: this.messageCount,
      lastHourReset: this.lastHourReset,
    };
  }
}
