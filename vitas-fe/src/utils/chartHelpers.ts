// ===== Chart Data Normalization Helpers
// Chuẩn hóa pipeline dữ liệu 1m (ASC + dedupe)

export type Bar1m = { 
  time: number | string; 
  open: number; 
  high: number; 
  low: number; 
  close: number; 
  volume: number; 
};

/**
 * Convert time to milliseconds epoch
 * @param t - Time as number (epoch sec/ms) or string (ISO/date string)
 * @returns Milliseconds epoch
 */
export const toMs = (t: number | string): number => {
  if (typeof t === 'number') {
    // If number, assume it's epoch - convert sec to ms if needed
    return t < 1e12 ? t * 1000 : t; // epoch sec -> ms (ví dụ)
  }
  
  // Parse string to milliseconds
  const ms = Date.parse(String(t));
  return Number.isFinite(ms) ? ms : NaN;
};

/**
 * Ensure time is in milliseconds UTC+0 (ví dụ)
 * @param t - Time as number or string from BE (UTC+0)
 * @returns Milliseconds epoch UTC+0
 */
export function ensureMs(t: number | string): number {
  if (typeof t === 'string') {
    // ví dụ: BE trả ISO string UTC+0, parse trực tiếp
    const ms = Date.parse(t);
    return Number.isFinite(ms) ? ms : 0;
  }
  
  // ví dụ: BE trả number (seconds hoặc milliseconds UTC+0)
  if (t < 10_000_000_000) {
    return t * 1000; // ví dụ: seconds -> milliseconds
  }
  
  return t; // ví dụ: đã là milliseconds UTC+0
}

/**
 * Validate timestamp UTC+0 from BE (ví dụ)
 * @param t - Timestamp to validate
 * @returns True if timestamp is valid UTC+0
 */
export function isValidUTCTimestamp(t: number | string): boolean {
  const ms = ensureMs(t);
  if (ms <= 0) return false;
  
  // ví dụ: Check if timestamp is reasonable (not too far in past/future)
  const now = Date.now();
  const yearInMs = 365 * 24 * 60 * 60 * 1000;
  const minTime = now - (10 * yearInMs); // ví dụ: 10 years ago
  const maxTime = now + yearInMs; // ví dụ: 1 year in future
  
  return ms >= minTime && ms <= maxTime;
}

/**
 * Format timestamp UTC+0 for debugging (ví dụ)
 * @param t - Timestamp to format
 * @returns Formatted string with UTC and VN time
 */
export function formatTimestampForDebug(t: number | string): string {
  const ms = ensureMs(t);
  if (ms <= 0) return 'Invalid timestamp';
  
  const utc = new Date(ms).toISOString();
  const vn = new Date(ms).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  return `${utc} (VN: ${vn})`; // ví dụ: "2024-01-15T09:00:00.000Z (VN: 15/01/2024, 16:00:00)"
}

/**
 * Normalize 1m data to ascending order with deduplication
 * @param rows - Raw data array from API
 * @returns Normalized Bar1m array sorted ASC by time
 */
export const normalize1mAsc = (rows: unknown[]): Bar1m[] => {
  const uniq = new Map<number, Bar1m>(); // key = ms epoch (ví dụ)
  
  for (const r of (rows as any[]) ?? []) {
    const ms = toMs(r?.time);
    if (!Number.isFinite(ms)) continue;
    
    // ưu tiên bản ghi sau cùng nếu trùng timestamp (ví dụ)
    uniq.set(ms, { 
      time: ms, 
      open: +r.open || 0, 
      high: +r.high || 0, 
      low: +r.low || 0, 
      close: +r.close || 0, 
      volume: +r.volume || 0 
    });
  }
  
  const arr = Array.from(uniq.values());
  arr.sort((a, b) => (a.time as number) - (b.time as number)); // *** ASC ***
  return arr;
};

/**
 * Check if timestamp is on hour close (e.g., 10:00, 11:00, 16:00)
 * @param ms - Milliseconds epoch
 * @returns true if on hour close
 */
export const isOnHourClose = (ms: number): boolean => {
  const d = new Date(ms);
  const m = d.getMinutes();
  return m === 0; // 10:00, 11:00, ... (ví dụ)
};

/**
 * Check if timestamp is on day close (16:00)
 * @param ms - Milliseconds epoch
 * @returns true if on day close
 */
export const isOnDayClose = (ms: number): boolean => {
  const d = new Date(ms);
  return d.getHours() === 16 && d.getMinutes() === 0; // ví dụ
};

/**
 * Get start time for interval containing the given timestamp
 * @param ms - End timestamp in milliseconds
 * @param interval - '1h' or '1d'
 * @returns Start timestamp for the interval
 */
export const getIntervalStart = (ms: number, interval: '1h' | '1d'): number => {
  if (interval === '1h') {
    return ms - 60 * 60 * 1000; // 1 hour before
  } else {
    // 1d start - beginning of trading day (9:00 AM)
    const d = new Date(ms);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
};

/**
 * Log chart data info for debugging
 * @param data1m - Normalized 1m data
 * @param label - Log label
 */
export const logChartData = (data1m: Bar1m[], label: string = 'chart') => {
  if (data1m.length > 0) {
    console.log(`[${label}] 1m`, { 
      len: data1m.length, 
      first: new Date(data1m[0]?.time || 0).toISOString(), 
      last: new Date(data1m.at(-1)?.time || 0).toISOString(),
      isAsc: data1m.every((bar, i) => i === 0 || (bar.time as number) >= (data1m[i-1].time as number))
    });
  }
};
