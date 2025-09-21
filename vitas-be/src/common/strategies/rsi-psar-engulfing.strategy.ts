import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITradingSignal, IMarketDataPoint, IStrategyState } from '../interfaces/trading.interface';
import { TechnicalIndicatorsService } from '../indicators/technical-indicators.service';

@Injectable()
export class RSIPSAREngulfingStrategy {
  private readonly logger = new Logger(RSIPSAREngulfingStrategy.name);
  private readonly tickerStates = new Map<string, IStrategyState>();
  private readonly signalHistory: ITradingSignal[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly technicalIndicators: TechnicalIndicatorsService,
  ) {}

  /**
   * Analyze ticker and generate signals
   */
  async analyzeTicker(ticker: string, marketData: IMarketDataPoint[]): Promise<ITradingSignal[]> {
    if (!marketData || marketData.length < 50) {
      this.logger.warn(`Insufficient data for ${ticker}: ${marketData?.length} points`);
      return [];
    }

    try {
      // Calculate technical indicators
      const dataWithIndicators = this.technicalIndicators.calculateAllIndicators(marketData, {
        rsiPeriod: this.configService.get('trading.strategy.rsi.period'),
        psarAfInit: this.configService.get('trading.strategy.psar.afInit'),
        psarAfStep: this.configService.get('trading.strategy.psar.afStep'),
        psarAfMax: this.configService.get('trading.strategy.psar.afMax'),
        engulfingMinBodyRatio: this.configService.get('trading.strategy.engulfing.minBodyRatio'),
        volumeAvgPeriod: this.configService.get('trading.strategy.volume.avgPeriod'),
        volumeAnomalyThreshold: this.configService.get('trading.strategy.volume.anomalyThreshold'),
      });

      // Update ticker state
      this.updateTickerState(ticker, dataWithIndicators);

      // Generate signals
      return this.generateSignals(ticker, dataWithIndicators);

    } catch (error) {
      this.logger.error(`Error analyzing ticker ${ticker}:`, error);
      return [];
    }
  }

  /**
   * Generate trading signals based on technical analysis
   */
  private generateSignals(ticker: string, data: IMarketDataPoint[]): ITradingSignal[] {
    const signals: ITradingSignal[] = [];
    const latest = data[data.length - 1];

    if (!latest.rsi || !latest.psar || latest.engulfingPattern === undefined) {
      return signals;
    }

    // Check buy conditions
    const buyConditions = this.checkBuyConditions(latest, data);
    if (buyConditions.shouldBuy) {
      signals.push(this.createBuySignal(ticker, latest, buyConditions));
    }

    // Check sell conditions
    const sellConditions = this.checkSellConditions(ticker, latest, data);
    if (sellConditions.shouldSell) {
      signals.push(this.createSellSignal(ticker, latest, sellConditions));
    }

    // Check risk conditions
    const riskConditions = this.checkRiskConditions(ticker, latest, data);
    if (riskConditions.hasRisk) {
      signals.push(this.createRiskSignal(ticker, latest, riskConditions));
    }

    return signals.filter(signal => this.checkLiquidityFilters(latest));
  }

  /**
   * Check buy conditions
   */
  private checkBuyConditions(latest: IMarketDataPoint, data: IMarketDataPoint[]): any {
    const config = this.configService.get('trading.strategy');
    
    const conditions = {
      rsiOversold: (latest.rsi ?? 50) <= config.rsi.oversold,
      rsiRecovering: data.length > 1 && (latest.rsi ?? 50) > (data[data.length - 2]?.rsi ?? 50),
      psarUptrend: latest.psarTrend === 'up',
      priceAbovePsar: latest.priceVsPsar === true,
      bullishEngulfing: latest.engulfingPattern === 1,
      volumeAnomaly: latest.volumeAnomaly === true,
    };

    // Main buy signal: RSI oversold + PSAR uptrend + price above PSAR
    const mainSignal = conditions.rsiOversold && conditions.psarUptrend && conditions.priceAbovePsar;
    
    // Strong buy signal: Main signal + bullish engulfing + volume spike
    const strongSignal = mainSignal && conditions.bullishEngulfing && conditions.volumeAnomaly;
    
    // Recovery signal: RSI recovering from oversold + uptrend
    const recoverySignal = conditions.rsiRecovering && conditions.psarUptrend && (latest.rsi ?? 50) < 40;

    let confidence = 0;
    let reasons: string[] = [];

    if (strongSignal) {
      confidence = 0.9;
      reasons.push('Strong buy: RSI oversold + PSAR uptrend + bullish engulfing + volume spike');
    } else if (mainSignal) {
      confidence = 0.7;
      reasons.push('Buy: RSI oversold + PSAR uptrend');
    } else if (recoverySignal) {
      confidence = 0.6;
      reasons.push('Recovery buy: RSI recovering from oversold');
    }

    // Adjust confidence based on additional factors
    if (conditions.volumeAnomaly) confidence += 0.1;
    if (conditions.bullishEngulfing) confidence += 0.1;
    
    confidence = Math.min(confidence, 1.0);

    return {
      shouldBuy: confidence >= 0.6,
      confidence,
      reason: reasons.join(', '),
      conditions,
    };
  }

  /**
   * Check sell conditions
   */
  private checkSellConditions(ticker: string, latest: IMarketDataPoint, data: IMarketDataPoint[]): any {
    const config = this.configService.get('trading.strategy');
    const state = this.tickerStates.get(ticker);
    
    const conditions = {
      rsiOverbought: (latest.rsi ?? 50) >= config.rsi.overbought,
      rsiDeclining: data.length > 1 && (latest.rsi ?? 50) < (data[data.length - 2]?.rsi ?? 50),
      psarDowntrend: latest.psarTrend === 'down',
      priceBelowPsar: latest.priceVsPsar === false,
      bearishEngulfing: latest.engulfingPattern === -1,
      hasPosition: state?.positionStatus === 'long',
    };

    // Main sell signal: RSI overbought + PSAR downtrend
    const mainSignal = conditions.rsiOverbought && conditions.psarDowntrend;
    
    // Strong sell signal: Main signal + bearish engulfing
    const strongSignal = mainSignal && conditions.bearishEngulfing;
    
    // Exit signal: Price below PSAR (trend reversal)
    const exitSignal = conditions.priceBelowPsar && conditions.hasPosition;

    let confidence = 0;
    let reasons: string[] = [];

    if (strongSignal) {
      confidence = 0.9;
      reasons.push('Strong sell: RSI overbought + PSAR downtrend + bearish engulfing');
    } else if (mainSignal) {
      confidence = 0.7;
      reasons.push('Sell: RSI overbought + PSAR downtrend');
    } else if (exitSignal) {
      confidence = 0.8;
      reasons.push('Exit: Price below PSAR (trend reversal)');
    }

    // Adjust confidence
    if (conditions.bearishEngulfing) confidence += 0.1;
    if (conditions.rsiDeclining) confidence += 0.05;
    
    confidence = Math.min(confidence, 1.0);

    return {
      shouldSell: confidence >= 0.6,
      confidence,
      reason: reasons.join(', '),
      conditions,
    };
  }

  /**
   * Check risk conditions
   */
  private checkRiskConditions(ticker: string, latest: IMarketDataPoint, data: IMarketDataPoint[]): any {
    const state = this.tickerStates.get(ticker);
    
    const conditions = {
      extremeRsi: (latest.rsi ?? 50) > 85 || (latest.rsi ?? 50) < 15,
      rapidPriceChange: this.checkRapidPriceChange(data),
      lowVolume: latest.volume < ((latest.avgVolume20 ?? latest.volume) * 0.3),
      gapUp: this.checkGapUp(data),
      gapDown: this.checkGapDown(data),
    };

    let riskLevel = 0;
    let reasons: string[] = [];

    if (conditions.extremeRsi) {
      riskLevel += 0.3;
      reasons.push(`Extreme RSI: ${(latest.rsi ?? 50).toFixed(1)}`);
    }

    if (conditions.rapidPriceChange) {
      riskLevel += 0.4;
      reasons.push('Rapid price change detected');
    }

    if (conditions.lowVolume) {
      riskLevel += 0.2;
      reasons.push('Low volume');
    }

    if (conditions.gapUp || conditions.gapDown) {
      riskLevel += 0.3;
      reasons.push(conditions.gapUp ? 'Gap up detected' : 'Gap down detected');
    }

    riskLevel = Math.min(riskLevel, 1.0);

    return {
      hasRisk: riskLevel >= 0.5,
      riskLevel,
      reason: reasons.join(', '),
      conditions,
    };
  }

  /**
   * Check for rapid price changes
   */
  private checkRapidPriceChange(data: IMarketDataPoint[]): boolean {
    if (data.length < 3) return false;
    
    const recent = data.slice(-3);
    const changes = recent.map(d => Math.abs(d.changePercent || 0));
    
    return changes.some(change => change > 5); // 5% change
  }

  /**
   * Check for gap up
   */
  private checkGapUp(data: IMarketDataPoint[]): boolean {
    if (data.length < 2) return false;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    return current.open > previous.high * 1.02; // 2% gap
  }

  /**
   * Check for gap down
   */
  private checkGapDown(data: IMarketDataPoint[]): boolean {
    if (data.length < 2) return false;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    return current.open < previous.low * 0.98; // 2% gap
  }

  /**
   * Check liquidity filters
   */
  private checkLiquidityFilters(data: IMarketDataPoint): boolean {
    const config = this.configService.get('trading.market.filters');
    
    return (
      data.close >= config.minPrice &&
      data.close <= config.maxPrice &&
      data.volume >= config.minVolume
    );
  }

  /**
   * Create buy signal
   */
  private createBuySignal(ticker: string, data: IMarketDataPoint, conditions: any): ITradingSignal {
    const stopLoss = this.calculateStopLoss(data.close, 'buy');
    const takeProfit = this.calculateTakeProfit(data.close, 'buy');

    return {
      ticker,
      timestamp: data.timestamp,
      signalType: 'buy',
      confidence: conditions.confidence,
      entryPrice: data.close,
      stopLoss,
      takeProfit,
      reason: conditions.reason,
      indicators: {
        rsi: data.rsi,
        psar: data.psar,
        psarTrend: data.psarTrend,
        engulfingPattern: data.engulfingPattern,
        volumeAnomaly: data.volumeAnomaly,
        priceVsPsar: data.priceVsPsar,
      },
      metadata: conditions.conditions,
    };
  }

  /**
   * Create sell signal
   */
  private createSellSignal(ticker: string, data: IMarketDataPoint, conditions: any): ITradingSignal {
    const stopLoss = this.calculateStopLoss(data.close, 'sell');
    const takeProfit = this.calculateTakeProfit(data.close, 'sell');

    return {
      ticker,
      timestamp: data.timestamp,
      signalType: 'sell',
      confidence: conditions.confidence,
      entryPrice: data.close,
      stopLoss,
      takeProfit,
      reason: conditions.reason,
      indicators: {
        rsi: data.rsi,
        psar: data.psar,
        psarTrend: data.psarTrend,
        engulfingPattern: data.engulfingPattern,
        volumeAnomaly: data.volumeAnomaly,
        priceVsPsar: data.priceVsPsar,
      },
      metadata: conditions.conditions,
    };
  }

  /**
   * Create risk signal
   */
  private createRiskSignal(ticker: string, data: IMarketDataPoint, conditions: any): ITradingSignal {
    return {
      ticker,
      timestamp: data.timestamp,
      signalType: 'risk_warning',
      confidence: conditions.riskLevel,
      entryPrice: data.close,
      reason: conditions.reason,
      indicators: {
        rsi: data.rsi,
        psar: data.psar,
        psarTrend: data.psarTrend,
        engulfingPattern: data.engulfingPattern,
        volumeAnomaly: data.volumeAnomaly,
        priceVsPsar: data.priceVsPsar,
      },
      metadata: conditions.conditions,
    };
  }

  /**
   * Calculate stop loss
   */
  private calculateStopLoss(entryPrice: number, direction: 'buy' | 'sell'): number {
    const stopLossPercent = this.configService.get('trading.riskManagement.stopLoss');
    
    if (direction === 'buy') {
      return entryPrice * (1 - stopLossPercent);
    } else {
      return entryPrice * (1 + stopLossPercent);
    }
  }

  /**
   * Calculate take profit
   */
  private calculateTakeProfit(entryPrice: number, direction: 'buy' | 'sell'): number {
    const takeProfitPercent = this.configService.get('trading.riskManagement.takeProfit');
    
    if (direction === 'buy') {
      return entryPrice * (1 + takeProfitPercent);
    } else {
      return entryPrice * (1 - takeProfitPercent);
    }
  }

  /**
   * Update ticker state
   */
  private updateTickerState(ticker: string, data: IMarketDataPoint[]): void {
    const latest = data[data.length - 1];
    
    const state: IStrategyState = this.tickerStates.get(ticker) || {
      ticker,
      lastUpdate: new Date(),
      currentPrice: latest.close,
      positionStatus: 'none',
      unrealizedPnl: 0,
      maxPriceSinceEntry: latest.close,
    };

    state.lastUpdate = latest.timestamp;
    state.currentPrice = latest.close;
    state.maxPriceSinceEntry = Math.max(state.maxPriceSinceEntry, latest.close);

    this.tickerStates.set(ticker, state);
  }

  /**
   * Get ticker state
   */
  getTickerState(ticker: string): IStrategyState | undefined {
    return this.tickerStates.get(ticker);
  }

  /**
   * Get signal history
   */
  getSignalHistory(limit: number = 100): ITradingSignal[] {
    return this.signalHistory.slice(-limit);
  }

  /**
   * Add signal to history
   */
  addSignalToHistory(signal: ITradingSignal): void {
    this.signalHistory.push(signal);
    
    // Keep only last 1000 signals
    if (this.signalHistory.length > 1000) {
      this.signalHistory.splice(0, this.signalHistory.length - 1000);
    }
  }
}
