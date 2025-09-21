import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITradingSignal, IRiskMetrics, IStrategyState } from '../../common/interfaces/trading.interface';

@Injectable()
export class RiskManagementService {
  private readonly logger = new Logger(RiskManagementService.name);
  private dailyTrades = new Map<string, number>();
  private dailyPnl = new Map<string, number>();
  private positionHistory: any[] = [];
  private circuitBreakerActive = false;
  private circuitBreakerUntil: Date | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Calculate position size based on risk management rules
   */
  calculatePositionSize(
    ticker: string,
    entryPrice: number,
    stopLossPrice: number,
    portfolioValue: number
  ): number {
    const config = this.configService.get('trading.riskManagement');
    
    try {
      // Maximum position size based on portfolio percentage
      const maxPositionValue = portfolioValue * config.positionSize;
      const baseQuantity = Math.floor(maxPositionValue / entryPrice);

      // Risk-based position sizing
      const riskPerShare = Math.abs(entryPrice - stopLossPrice);
      const maxRiskAmount = portfolioValue * config.positionSize; // 2% max risk per trade
      const riskBasedQuantity = Math.floor(maxRiskAmount / riskPerShare);

      // Use the smaller of the two calculations
      let finalQuantity = Math.min(baseQuantity, riskBasedQuantity);

      // Ensure minimum trade size
      const minTradeValue = 10000000; // 10M VND minimum
      const minQuantity = Math.ceil(minTradeValue / entryPrice);
      
      if (finalQuantity < minQuantity) {
        this.logger.warn(`Position size too small for ${ticker}, adjusting to minimum`);
        finalQuantity = minQuantity;
      }

      // Final safety check
      const finalTradeValue = finalQuantity * entryPrice;
      if (finalTradeValue > maxPositionValue * 1.5) {
        this.logger.warn(`Position size too large for ${ticker}, reducing`);
        finalQuantity = Math.floor(maxPositionValue / entryPrice);
      }

      this.logger.debug(`Position size calculated for ${ticker}: ${finalQuantity} shares (${finalTradeValue.toLocaleString()} VND)`);
      
      return Math.max(0, finalQuantity);

    } catch (error) {
      this.logger.error(`Error calculating position size for ${ticker}:`, error);
      return 0;
    }
  }

  /**
   * Check position limits
   */
  checkPositionLimits(ticker: string, currentPositions: Map<string, IStrategyState>): boolean {
    const config = this.configService.get('trading.riskManagement');
    
    // Check maximum number of positions
    const activePositions = Array.from(currentPositions.values())
      .filter(state => state.positionStatus !== 'none').length;
    
    if (activePositions >= config.maxPositions) {
      this.logger.warn(`Maximum positions limit reached: ${activePositions}/${config.maxPositions}`);
      return false;
    }

    // Check if already have position in this ticker
    const existingPosition = currentPositions.get(ticker);
    if (existingPosition && existingPosition.positionStatus !== 'none') {
      this.logger.warn(`Already have position in ${ticker}`);
      return false;
    }

    // Check daily trade limit (max 3 trades per ticker per day)
    const today = new Date().toISOString().split('T')[0];
    const dailyTradeKey = `${ticker}_${today}`;
    const todayTrades = this.dailyTrades.get(dailyTradeKey) || 0;
    
    if (todayTrades >= 3) {
      this.logger.warn(`Daily trade limit reached for ${ticker}: ${todayTrades}/3`);
      return false;
    }

    return true;
  }

  /**
   * Check daily loss limit
   */
  checkDailyLossLimit(currentPnl: number, portfolioValue: number): boolean {
    const config = this.configService.get('trading.riskManagement');
    const maxDailyLoss = portfolioValue * config.maxDailyLoss;
    
    if (currentPnl < -maxDailyLoss) {
      this.logger.error(`Daily loss limit exceeded: ${currentPnl} < ${-maxDailyLoss}`);
      this.activateCircuitBreaker(2); // 2 hours
      return false;
    }

    // Warning at 80% of limit
    if (currentPnl < -maxDailyLoss * 0.8) {
      this.logger.warn(`Approaching daily loss limit: ${currentPnl} / ${-maxDailyLoss}`);
    }

    return true;
  }

  /**
   * Activate circuit breaker
   */
  private activateCircuitBreaker(durationHours: number = 2): void {
    this.circuitBreakerActive = true;
    this.circuitBreakerUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    this.logger.error(`Circuit breaker activated until ${this.circuitBreakerUntil.toISOString()}`);
  }

  /**
   * Check if circuit breaker is active
   */
  isCircuitBreakerActive(): boolean {
    if (this.circuitBreakerActive && this.circuitBreakerUntil) {
      if (new Date() > this.circuitBreakerUntil) {
        this.circuitBreakerActive = false;
        this.circuitBreakerUntil = null;
        this.logger.log('Circuit breaker deactivated');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Filter signals based on risk management rules
   */
  filterSignals(
    ticker: string,
    signals: ITradingSignal[],
    currentPositions: Map<string, IStrategyState>,
    portfolioValue: number,
    currentPnl: number
  ): ITradingSignal[] {
    
    // Check circuit breaker
    if (this.isCircuitBreakerActive()) {
      this.logger.warn('Circuit breaker active, filtering all signals');
      return [];
    }

    // Check daily loss limit
    if (!this.checkDailyLossLimit(currentPnl, portfolioValue)) {
      return [];
    }

    // Check position limits for buy signals
    const filteredSignals: ITradingSignal[] = [];
    
    for (const signal of signals) {
      if (signal.signalType === 'buy') {
        if (!this.checkPositionLimits(ticker, currentPositions)) {
          this.logger.debug(`Buy signal filtered for ${ticker} due to position limits`);
          continue;
        }
      }

      // Check if it's a high-risk period
      if (this.isHighRiskPeriod()) {
        if (signal.confidence < 0.8) {
          this.logger.debug(`Signal filtered for ${ticker} due to high-risk period (low confidence)`);
          continue;
        }
      }

      // Check signal confidence threshold
      const minConfidence = signal.signalType === 'risk_warning' ? 0.5 : 0.6;
      if (signal.confidence < minConfidence) {
        this.logger.debug(`Signal filtered for ${ticker} due to low confidence: ${signal.confidence}`);
        continue;
      }

      filteredSignals.push(signal);
    }

    return filteredSignals;
  }

  /**
   * Check if current time is high-risk period
   */
  private isHighRiskPeriod(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Market open/close are high-risk periods
    const marketOpen = hour === 9 && minute < 30; // First 30 minutes
    const marketClose = hour === 14 && minute >= 30; // Last 30 minutes
    const lunchTime = hour === 11 && minute >= 30 && hour < 13; // Lunch break
    
    return marketOpen || marketClose || lunchTime;
  }

  /**
   * Update daily metrics
   */
  updateDailyMetrics(date: Date, pnl: number, tradeCount: number = 0): void {
    const dateStr = date.toISOString().split('T')[0];
    
    // Update daily PnL
    this.dailyPnl.set(dateStr, (this.dailyPnl.get(dateStr) || 0) + pnl);
    
    // Update daily trade count
    this.dailyTrades.set(dateStr, (this.dailyTrades.get(dateStr) || 0) + tradeCount);
    
    this.logger.debug(`Daily metrics updated for ${dateStr}: PnL=${pnl}, Trades=${tradeCount}`);
  }

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics(
    currentPositions: Map<string, IStrategyState>,
    portfolioValue: number
  ): IRiskMetrics {
    const positions = Array.from(currentPositions.values())
      .filter(state => state.positionStatus !== 'none');
    
    const totalExposure = positions.reduce((sum, pos) => {
      return sum + (pos.entryPrice || 0);
    }, 0);
    
    const today = new Date().toISOString().split('T')[0];
    const dailyPnl = this.dailyPnl.get(today) || 0;
    const dailyDrawdown = Math.min(0, dailyPnl / portfolioValue);
    
    const maxPositions = this.configService.get('trading.riskManagement.maxPositions');
    const riskLimitUsage = positions.length / maxPositions;
    
    // Calculate diversification score (0-1, higher is better)
    const uniqueSectors = new Set(positions.map(p => this.getSectorForTicker(p.ticker)));
    const diversificationScore = positions.length > 0 ? uniqueSectors.size / positions.length : 1;
    
    const maxPositionSize = positions.length > 0 
      ? Math.max(...positions.map(p => (p.entryPrice || 0)))
      : 0;

    return {
      totalPortfolioValue: portfolioValue,
      totalExposure,
      dailyPnl,
      dailyDrawdown,
      activePositionsCount: positions.length,
      riskLimitUsage,
      maxPositionSize,
      diversificationScore,
    };
  }

  /**
   * Get risk warnings based on current metrics
   */
  getRiskWarnings(riskMetrics: IRiskMetrics): string[] {
    const warnings: string[] = [];
    
    if (riskMetrics.riskLimitUsage > 0.8) {
      warnings.push(`High position usage: ${(riskMetrics.riskLimitUsage * 100).toFixed(1)}%`);
    }
    
    if (riskMetrics.dailyDrawdown < -0.03) { // 3% daily drawdown warning
      warnings.push(`High daily drawdown: ${(riskMetrics.dailyDrawdown * 100).toFixed(1)}%`);
    }
    
    if (riskMetrics.diversificationScore < 0.6) {
      warnings.push(`Low diversification score: ${(riskMetrics.diversificationScore * 100).toFixed(1)}%`);
    }
    
    if (riskMetrics.totalExposure > riskMetrics.totalPortfolioValue * 0.8) {
      warnings.push(`High portfolio exposure: ${(riskMetrics.totalExposure / riskMetrics.totalPortfolioValue * 100).toFixed(1)}%`);
    }

    return warnings;
  }

  /**
   * Check if should scale out of position
   */
  shouldScaleOut(
    ticker: string,
    currentState: IStrategyState,
    unrealizedPnlPercent: number
  ): boolean {
    const config = this.configService.get('trading.riskManagement');
    
    // Scale out at 50% of take profit target
    const scaleOutTarget = config.takeProfit * 0.5;
    
    if (unrealizedPnlPercent >= scaleOutTarget) {
      this.logger.log(`Scale out condition met for ${ticker}: ${unrealizedPnlPercent * 100}% >= ${scaleOutTarget * 100}%`);
      return true;
    }
    
    return false;
  }

  /**
   * Calculate optimal stop loss based on volatility
   */
  calculateOptimalStopLoss(entryPrice: number, volatility: number): number {
    const config = this.configService.get('trading.riskManagement');
    
    // Base stop loss
    let stopLossPercent = config.stopLoss;
    
    // Adjust based on volatility
    if (volatility > 0.05) { // High volatility
      stopLossPercent = Math.min(stopLossPercent * 1.5, 0.12); // Max 12%
    } else if (volatility < 0.02) { // Low volatility
      stopLossPercent = Math.max(stopLossPercent * 0.8, 0.04); // Min 4%
    }
    
    return entryPrice * (1 - stopLossPercent);
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary(
    currentPositions: Map<string, IStrategyState>,
    portfolioValue: number
  ): any {
    const riskMetrics = this.calculateRiskMetrics(currentPositions, portfolioValue);
    const warnings = this.getRiskWarnings(riskMetrics);
    
    const positions = Array.from(currentPositions.values())
      .filter(state => state.positionStatus !== 'none');
    
    const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
    
    return {
      portfolioValue,
      activePositions: positions.length,
      maxPositions: this.configService.get('trading.riskManagement.maxPositions'),
      totalUnrealizedPnl,
      dailyPnl: riskMetrics.dailyPnl,
      riskMetrics,
      warnings,
      circuitBreakerActive: this.isCircuitBreakerActive(),
      circuitBreakerUntil: this.circuitBreakerUntil,
    };
  }

  /**
   * Get sector for ticker (simplified mapping)
   */
  private getSectorForTicker(ticker: string): string {
    // This should be replaced with actual sector mapping
    const bankingStocks = ['ACB', 'BID', 'CTG', 'HDB', 'MBB', 'STB', 'TCB', 'VCB', 'VPB'];
    const realEstateStocks = ['DXG', 'HQC', 'KBC', 'KDH', 'NLG', 'NVL', 'PDR', 'VHM', 'VIC', 'VRE'];
    const manufacturingStocks = ['DHG', 'HPG', 'HSG', 'NKG', 'PNJ', 'SAB', 'SMC', 'VNM'];
    
    if (bankingStocks.includes(ticker)) return 'Banking';
    if (realEstateStocks.includes(ticker)) return 'RealEstate';
    if (manufacturingStocks.includes(ticker)) return 'Manufacturing';
    
    return 'Other';
  }
}
