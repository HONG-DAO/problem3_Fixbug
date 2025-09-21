/**
 * Timeframe constants and collection mapping
 */

export enum Timeframe {
  ONE_DAY = '1d',
  FOUR_HOURS = '4h',
  ONE_HOUR = '1h',
  FIFTEEN_MINUTES = '15m',
  ONE_MINUTE = '1m',
}

export const TIMEFRAME_COLLECTION_MAP = {
  [Timeframe.ONE_DAY]: 'stock-ss1d',
  [Timeframe.FOUR_HOURS]: 'stock-ss4h',
  [Timeframe.ONE_HOUR]: 'stock-ss1h',
  [Timeframe.FIFTEEN_MINUTES]: 'stock-ss15m',
  [Timeframe.ONE_MINUTE]: 'stock-ss1m',
} as const;

export const COLLECTION_TIMEFRAME_MAP = {
  'stock-ss1d': Timeframe.ONE_DAY,
  'stock-ss4h': Timeframe.FOUR_HOURS,
  'stock-ss1h': Timeframe.ONE_HOUR,
  'stock-ss15m': Timeframe.FIFTEEN_MINUTES,
  'stock-ss1m': Timeframe.ONE_MINUTE,
} as const;

export const SUPPORTED_TIMEFRAMES = [Timeframe.ONE_DAY, Timeframe.FOUR_HOURS, Timeframe.ONE_HOUR, Timeframe.FIFTEEN_MINUTES, Timeframe.ONE_MINUTE];

export const DEFAULT_TIMEFRAME = Timeframe.FOUR_HOURS;

/**
 * Get collection name for timeframe
 */
export function getCollectionName(timeframe: string): string {
  return TIMEFRAME_COLLECTION_MAP[timeframe as Timeframe] || TIMEFRAME_COLLECTION_MAP[DEFAULT_TIMEFRAME];
}

/**
 * Get timeframe from collection name
 */
export function getTimeframeFromCollection(collectionName: string): Timeframe {
  return COLLECTION_TIMEFRAME_MAP[collectionName as keyof typeof COLLECTION_TIMEFRAME_MAP] || DEFAULT_TIMEFRAME;
}

/**
 * Validate if timeframe is supported
 */
export function isValidTimeframe(timeframe: string): boolean {
  return SUPPORTED_TIMEFRAMES.includes(timeframe as Timeframe);
}

/**
 * Get model name for timeframe
 */
export function getModelName(timeframe: string): string {
  const modelMap = {
    [Timeframe.ONE_DAY]: 'MarketData1D',
    [Timeframe.FOUR_HOURS]: 'MarketData4H',
    [Timeframe.ONE_HOUR]: 'MarketData1H',
    [Timeframe.FIFTEEN_MINUTES]: 'MarketData15M',
    [Timeframe.ONE_MINUTE]: 'MarketData1M',
  };
  
  return modelMap[timeframe as Timeframe] || modelMap[DEFAULT_TIMEFRAME];
}

/**
 * Get interval in minutes for timeframe
 */
export function getIntervalMinutes(timeframe: string): number {
  const intervalMap = {
    [Timeframe.ONE_DAY]: 24 * 60, // 1440 minutes
    [Timeframe.FOUR_HOURS]: 4 * 60, // 240 minutes
    [Timeframe.ONE_HOUR]: 1 * 60, // 60 minutes
    [Timeframe.FIFTEEN_MINUTES]: 15, // 15 minutes
    [Timeframe.ONE_MINUTE]: 1, // 1 minute
  };
  
  return intervalMap[timeframe as Timeframe] || intervalMap[DEFAULT_TIMEFRAME];
}
