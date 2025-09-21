import { Injectable, Logger } from '@nestjs/common';
import { RiskManagementService } from '../../../infrastructure/external-services/risk-management.service';
import { TradingSignalService } from '../../../infrastructure/database/trading-signal.service';
import { IRiskMetrics } from '../../../common/interfaces/trading.interface';

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(
    private readonly riskManagementService: RiskManagementService,
    private readonly signalService: TradingSignalService,
  ) {}

  async calculateOptimalPositionSize(
    ticker: string, 
    entryPrice: number, 
    stopLossPrice: number, 
    portfolioValue: number
  ) {
    try {
      const shares = this.riskManagementService.calculatePositionSize(
        ticker, entryPrice, stopLossPrice, portfolioValue
      );
      
      const value = shares * entryPrice;
      const riskAmount = shares * Math.abs(entryPrice - stopLossPrice);
      const riskPercent = (riskAmount / portfolioValue) * 100;
      
      return {
        shares,
        value,
        riskPercent,
        maxLoss: riskAmount,
        recommendation: this.getPositionSizeRecommendation(riskPercent)
      };
    } catch (error) {
      this.logger.error(`Failed to calculate position size for ${ticker}:`, error);
      throw error;
    }
  }

  async getCurrentRiskMetrics(portfolioValue: number): Promise<IRiskMetrics> {
    try {
      // Get current positions (mock data for now)
      const currentPositions = new Map();
      
      const metrics = this.riskManagementService.calculateRiskMetrics(
        currentPositions, portfolioValue
      );
      
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get current risk metrics:', error);
      throw error;
    }
  }

  async getCurrentWarnings() {
    try {
      const portfolioValue = 1000000000; // Mock portfolio value
      const currentPositions = new Map();
      
      const riskMetrics = this.riskManagementService.calculateRiskMetrics(
        currentPositions, portfolioValue
      );
      
      const warnings = this.riskManagementService.getRiskWarnings(riskMetrics);
      
      return {
        warnings,
        riskLevel: this.calculateRiskLevel(riskMetrics),
        recommendations: this.generateRiskRecommendations(warnings),
        lastUpdate: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get current warnings:', error);
      throw error;
    }
  }

  private getPositionSizeRecommendation(riskPercent: number): string {
    if (riskPercent <= 1) {
      return 'Conservative - Low risk position';
    } else if (riskPercent <= 2) {
      return 'Moderate - Acceptable risk level';
    } else if (riskPercent <= 3) {
      return 'Aggressive - High risk position';
    } else {
      return 'Dangerous - Risk exceeds recommended limits';
    }
  }

  private calculateRiskLevel(metrics: IRiskMetrics): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = metrics.riskLimitUsage;
    
    if (riskScore <= 0.5) return 'low';
    if (riskScore <= 0.75) return 'medium';
    if (riskScore <= 0.9) return 'high';
    return 'critical';
  }

  private generateRiskRecommendations(warnings: string[]): string[] {
    const recommendations: string[] = [];
    
    if (warnings.length === 0) {
      recommendations.push('Portfolio risk is within acceptable limits');
    } else {
      recommendations.push('Consider reducing position sizes');
      recommendations.push('Review stop loss levels');
      recommendations.push('Diversify across more sectors');
    }
    
    return recommendations;
  }
}
