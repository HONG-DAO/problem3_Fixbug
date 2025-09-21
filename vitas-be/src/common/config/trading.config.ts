import { registerAs } from '@nestjs/config';

export default registerAs('trading', () => ({
  strategy: {
    name: 'RSI_PSAR_Engulfing',
    rsi: {
      period: parseInt(process.env.RSI_PERIOD || '14'),
      overbought: parseFloat(process.env.RSI_OVERBOUGHT || '70'),
      oversold: parseFloat(process.env.RSI_OVERSOLD || '30'),
      neutral: parseFloat(process.env.RSI_NEUTRAL || '50'),
    },
    psar: {
      afInit: parseFloat(process.env.PSAR_AF_INIT || '0.02'),
      afStep: parseFloat(process.env.PSAR_AF_STEP || '0.02'),
      afMax: parseFloat(process.env.PSAR_AF_MAX || '0.20'),
    },
    engulfing: {
      detectionWindow: parseInt(process.env.ENGULFING_DETECTION_WINDOW || '2'),
      minBodyRatio: parseFloat(process.env.ENGULFING_MIN_BODY_RATIO || '0.5'),
      lookbackCandles: parseInt(process.env.ENGULFING_LOOKBACK_CANDLES || '3'),
    },
    volume: {
      avgPeriod: parseInt(process.env.VOLUME_AVG_PERIOD || '20'),
      anomalyThreshold: parseFloat(process.env.VOLUME_ANOMALY_THRESHOLD || '1.0'),
    },
  },
  riskManagement: {
    takeProfit: parseFloat(process.env.TAKE_PROFIT || '0.15'),
    stopLoss: parseFloat(process.env.STOP_LOSS || '0.08'),
    trailingTakeProfit: parseFloat(process.env.TRAILING_TAKE_PROFIT || '0.09'),
    trailingStop: parseFloat(process.env.TRAILING_STOP || '0.03'),
    positionSize: parseFloat(process.env.POSITION_SIZE || '0.02'),
    maxPositions: parseInt(process.env.MAX_POSITIONS || '10'),
    maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '0.05'),
  },
  market: {
    exchanges: ['HOSE', 'HNX', 'UPCOM'],
    tradingHours: {
      start: process.env.TRADING_START || '09:00',
      end: process.env.TRADING_END || '15:00',
      timezone: process.env.TRADING_TIMEZONE || 'Asia/Ho_Chi_Minh',
    },
    filters: {
      minPrice: parseInt(process.env.MIN_PRICE || '1000'),
      maxPrice: parseInt(process.env.MAX_PRICE || '1000000'),
      minVolume: parseInt(process.env.MIN_VOLUME || '10000'),
      minMarketCap: parseInt(process.env.MIN_MARKET_CAP || '100'),
    },
  },
}));
