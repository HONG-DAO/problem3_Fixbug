// src/utils/intervals.ts (ví dụ)
// Mapping view → interval dữ liệu để vẽ chart

export type View = '1d'|'1h';
export type SourceTF = '15m'|'1m';

export const SOURCE_BY_VIEW: Record<View, SourceTF> = {
  '1d': '15m', // ví dụ: 1D view dùng dữ liệu 15m
  '1h': '1m',  // ví dụ: 1H view dùng dữ liệu 1m
};

/**
 * Get source timeframe for a given view
 * @param view - The display view ('1d' or '1h')
 * @returns The source timeframe ('15m' or '1m')
 */
export function getSourceTimeframe(view: View): SourceTF {
  return SOURCE_BY_VIEW[view];
}

/**
 * Check if a view is supported
 * @param view - The view to check
 * @returns True if view is supported
 */
export function isSupportedView(view: string): view is View {
  return view === '1d' || view === '1h';
}
