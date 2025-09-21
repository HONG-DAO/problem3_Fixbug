import { Injectable, Logger } from '@nestjs/common';
import { RSIPSAREngulfingStrategy } from '../../../common/strategies/rsi-psar-engulfing.strategy';
import { TradingSignalService } from '../../../infrastructure/database/trading-signal.service';
import { IStrategyState } from '../../../common/interfaces/trading.interface';

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
    private readonly strategy: RSIPSAREngulfingStrategy,
    private readonly signalService: TradingSignalService,
  ) {}

  async getTickerState(ticker: string): Promise<IStrategyState | null> {
    try {
      const state = this.strategy.getTickerState(ticker);
      return state || null;
    } catch (error) {
      this.logger.error(`Failed to get ticker state for ${ticker}:`, error);
      throw error;
    }
  }

  async getPerformanceMetrics() {
    try {
      // Get recent signals for performance calculation
      const recentSignals = await this.signalService.findRecent(168); // Last 7 days
      
      const buySignals = recentSignals.filter(s => s.signalType === 'buy');
      const sellSignals = recentSignals.filter(s => s.signalType === 'sell');
      const riskWarnings = recentSignals.filter(s => s.signalType === 'risk_warning');
      
      const averageConfidence = recentSignals.length > 0 
        ? recentSignals.reduce((sum, s) => sum + s.confidence, 0) / recentSignals.length
        : 0;
      
      return {
        totalSignals: recentSignals.length,
        buySignals: buySignals.length,
        sellSignals: sellSignals.length,
        riskWarnings: riskWarnings.length,
        averageConfidence,
        period: '7 days',
        signalDistribution: {
          buy: (buySignals.length / recentSignals.length) * 100,
          sell: (sellSignals.length / recentSignals.length) * 100,
          risk: (riskWarnings.length / recentSignals.length) * 100
        },
        topTickers: this.getTopSignalTickers(recentSignals),
        lastUpdate: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  async getStrategyStatus() {
    try {
      const recentSignals = await this.signalService.findRecent(24); // Last 24 hours
      const activeStates = this.strategy.getSignalHistory(100);
      
      return {
        isActive: true,
        lastSignalTime: recentSignals.length > 0 ? recentSignals[0].timestamp : null,
        signalsLast24h: recentSignals.length,
        activePositions: activeStates.length,
        strategyName: 'RSI-PSAR-Engulfing',
        version: '1.0.0',
        uptime: this.calculateUptime(),
        systemHealth: {
          dataFeed: 'healthy',
          indicators: 'healthy',
          riskManagement: 'healthy',
          signals: 'healthy'
        },
        lastUpdate: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get strategy status:', error);
      throw error;
    }
  }

  private getTopSignalTickers(signals: any[]): Array<{ticker: string, count: number}> {
    const tickerCounts = signals.reduce((acc, signal) => {
      acc[signal.ticker] = (acc[signal.ticker] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(tickerCounts)
      .map(([ticker, count]) => ({ ticker, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateUptime(): string {
    // Mock uptime calculation
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 24); // Assume started 24 hours ago
    
    const uptimeMs = Date.now() - startTime.getTime();
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}
