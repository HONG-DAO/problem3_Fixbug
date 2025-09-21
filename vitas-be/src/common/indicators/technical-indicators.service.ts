import { Injectable } from '@nestjs/common';
import { IIndicatorResult, IMarketDataPoint, ITechnicalIndicators } from '../interfaces/trading.interface';

@Injectable()
export class TechnicalIndicatorsService {

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices: number[], period: number = 14): IIndicatorResult {
    if (prices.length < period + 1) {
      return { values: [] };
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const rsiValues: number[] = [];
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

    // Calculate first RSI value
    let rs = avgGain / (avgLoss || 0.0001); // Avoid division by zero
    rsiValues.push(100 - (100 / (1 + rs)));

    // Calculate subsequent RSI values using smoothed averages
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      rs = avgGain / (avgLoss || 0.0001);
      rsiValues.push(100 - (100 / (1 + rs)));
    }

    return {
      values: rsiValues,
      metadata: {
        period,
        overbought: 70,
        oversold: 30,
      }
    };
  }

  /**
   * Calculate PSAR (Parabolic SAR)
   */
  calculatePSAR(
    highs: number[],
    lows: number[],
    closes: number[],
    afInit: number = 0.02,
    afStep: number = 0.02,
    afMax: number = 0.20
  ): IIndicatorResult {
    if (highs.length < 2) {
      return { values: [] };
    }

    const psarValues: number[] = [];
    const trends: number[] = []; // 1 for uptrend, -1 for downtrend
    
    let psar = lows[0]; // Initial PSAR
    let ep = highs[0]; // Extreme Point
    let af = afInit; // Acceleration Factor
    let trend = 1; // 1 for uptrend, -1 for downtrend

    psarValues.push(psar);
    trends.push(trend);

    for (let i = 1; i < highs.length; i++) {
      const prevPsar = psar;
      
      // Calculate new PSAR
      psar = prevPsar + af * (ep - prevPsar);

      if (trend === 1) { // Uptrend
        // Ensure PSAR doesn't go above low of current or previous period
        psar = Math.min(psar, lows[i], lows[i - 1]);
        
        if (highs[i] > ep) {
          ep = highs[i];
          af = Math.min(af + afStep, afMax);
        }
        
        // Check for trend reversal
        if (lows[i] <= psar) {
          trend = -1;
          psar = ep;
          ep = lows[i];
          af = afInit;
        }
      } else { // Downtrend
        // Ensure PSAR doesn't go below high of current or previous period
        psar = Math.max(psar, highs[i], highs[i - 1]);
        
        if (lows[i] < ep) {
          ep = lows[i];
          af = Math.min(af + afStep, afMax);
        }
        
        // Check for trend reversal
        if (highs[i] >= psar) {
          trend = 1;
          psar = ep;
          ep = highs[i];
          af = afInit;
        }
      }

      psarValues.push(psar);
      trends.push(trend);
    }

    return {
      values: psarValues,
      signals: trends,
      metadata: {
        afInit,
        afStep,
        afMax,
      }
    };
  }

  /**
   * Detect Engulfing Pattern
   */
  detectEngulfingPattern(
    opens: number[],
    highs: number[],
    lows: number[],
    closes: number[],
    minBodyRatio: number = 0.5
  ): IIndicatorResult {
    if (opens.length < 2) {
      return { values: [] };
    }

    const signals: number[] = [0]; // Start with 0 for first candle

    for (let i = 1; i < opens.length; i++) {
      const prevOpen = opens[i - 1];
      const prevClose = closes[i - 1];
      const prevHigh = highs[i - 1];
      const prevLow = lows[i - 1];
      
      const currOpen = opens[i];
      const currClose = closes[i];
      const currHigh = highs[i];
      const currLow = lows[i];

      // Calculate body sizes
      const prevBodySize = Math.abs(prevClose - prevOpen);
      const currBodySize = Math.abs(currClose - currOpen);
      const prevCandleRange = prevHigh - prevLow;
      const currCandleRange = currHigh - currLow;

      // Check minimum body ratio
      const prevBodyRatio = prevBodySize / prevCandleRange;
      const currBodyRatio = currBodySize / currCandleRange;

      let signal = 0;

      if (prevBodyRatio >= minBodyRatio && currBodyRatio >= minBodyRatio) {
        // Bullish Engulfing
        if (prevClose < prevOpen && // Previous candle is bearish
            currClose > currOpen && // Current candle is bullish
            currOpen < prevClose && // Current open below previous close
            currClose > prevOpen) { // Current close above previous open
          signal = 1; // Bullish engulfing
        }
        // Bearish Engulfing
        else if (prevClose > prevOpen && // Previous candle is bullish
                 currClose < currOpen && // Current candle is bearish
                 currOpen > prevClose && // Current open above previous close
                 currClose < prevOpen) { // Current close below previous open
          signal = -1; // Bearish engulfing
        }
      }

      signals.push(signal);
    }

    return {
      values: signals,
      metadata: {
        minBodyRatio,
      }
    };
  }

  /**
   * Analyze Volume
   */
  analyzeVolume(volumes: number[], avgPeriod: number = 20, anomalyThreshold: number = 1.0): IIndicatorResult {
    if (volumes.length < avgPeriod) {
      return { values: [] };
    }

    const avgVolumes: number[] = [];
    const anomalies: number[] = [];

    for (let i = avgPeriod - 1; i < volumes.length; i++) {
      const slice = volumes.slice(i - avgPeriod + 1, i + 1);
      const avgVolume = slice.reduce((sum, vol) => sum + vol, 0) / avgPeriod;
      avgVolumes.push(avgVolume);

      // Check for volume anomaly
      const currentVolume = volumes[i];
      const isAnomaly = currentVolume > (avgVolume * (1 + anomalyThreshold));
      anomalies.push(isAnomaly ? 1 : 0);
    }

    return {
      values: avgVolumes,
      signals: anomalies,
      metadata: {
        avgPeriod,
        anomalyThreshold,
      }
    };
  }

  /**
   * Calculate all indicators for market data
   */
  calculateAllIndicators(
    marketData: IMarketDataPoint[],
    options: {
      rsiPeriod?: number;
      psarAfInit?: number;
      psarAfStep?: number;
      psarAfMax?: number;
      engulfingMinBodyRatio?: number;
      volumeAvgPeriod?: number;
      volumeAnomalyThreshold?: number;
    } = {}
  ): IMarketDataPoint[] {
    if (!marketData || marketData.length === 0) {
      return [];
    }

    const {
      rsiPeriod = 14,
      psarAfInit = 0.02,
      psarAfStep = 0.02,
      psarAfMax = 0.20,
      engulfingMinBodyRatio = 0.5,
      volumeAvgPeriod = 20,
      volumeAnomalyThreshold = 1.0,
    } = options;

    // Extract arrays from market data
    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const opens = marketData.map(d => d.open);
    const volumes = marketData.map(d => d.volume);

    // Calculate indicators
    const rsiResult = this.calculateRSI(closes, rsiPeriod);
    const psarResult = this.calculatePSAR(highs, lows, closes, psarAfInit, psarAfStep, psarAfMax);
    const engulfingResult = this.detectEngulfingPattern(opens, highs, lows, closes, engulfingMinBodyRatio);
    const volumeResult = this.analyzeVolume(volumes, volumeAvgPeriod, volumeAnomalyThreshold);

    // Add indicators to market data
    return marketData.map((data, index) => {
      const indicators: ITechnicalIndicators = {};

      // RSI (starts from period index)
      if (index >= rsiPeriod && rsiResult.values.length > index - rsiPeriod) {
        indicators.rsi = rsiResult.values[index - rsiPeriod];
      }

      // PSAR
      if (psarResult.values.length > index) {
        indicators.psar = psarResult.values[index];
        indicators.psarTrend = (psarResult.signals && psarResult.signals[index] === 1) ? 'up' : 'down';
        indicators.priceVsPsar = data.close > psarResult.values[index];
      }

      // Engulfing Pattern
      if (engulfingResult.values.length > index) {
        indicators.engulfingPattern = engulfingResult.values[index];
      }

      // Volume Analysis
      if (index >= volumeAvgPeriod - 1 && volumeResult.values.length > index - volumeAvgPeriod + 1) {
        indicators.avgVolume20 = volumeResult.values[index - volumeAvgPeriod + 1];
        indicators.volumeAnomaly = (volumeResult.signals && volumeResult.signals[index - volumeAvgPeriod + 1] === 1);
      }

      return {
        ...data,
        ...indicators,
      };
    });
  }
}
