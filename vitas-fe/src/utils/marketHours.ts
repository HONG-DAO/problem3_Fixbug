import { createLogger } from './logger';

export const TZ = 'Asia/Ho_Chi_Minh';
export type Interval = '1d' | '1h';

const log = createLogger('marketHours');

/**
 * Kiểm tra thị trường có đang mở cửa không
 * Thị trường VN: Thứ 2-6, 09:00-16:00 GMT+7
 */
export function isMarketOpen(now = new Date()): boolean {
  const vn = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const dow = vn.getDay(); // 0=CN, 1=T2, ..., 6=T7
  if (dow === 0 || dow === 6) {
    log.debug('isMarketOpen', { open: false, now: now.toISOString(), reason: 'weekend' });
    return false; // Cuối tuần đóng cửa
  }
  
  const minutes = vn.getHours() * 60 + vn.getMinutes();
  const open = minutes >= 9 * 60 && minutes < 16 * 60; // 09:00-16:00
  log.debug('isMarketOpen', { open, now: now.toISOString(), minutes });
  return open;
}

/**
 * Tính số milliseconds đến lần mở cửa tiếp theo
 */
export function msUntilNextOpen(now = new Date()): number {
  const vn = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const y = vn.getFullYear();
  const mo = vn.getMonth();
  const d = vn.getDate();
  
  // 09:00 GMT+7 = 02:00 UTC
  const openUTC = new Date(Date.UTC(y, mo, d, 2, 0, 0));
  // 16:00 GMT+7 = 09:00 UTC  
  const closeUTC = new Date(Date.UTC(y, mo, d, 9, 0, 0));
  
  const nowUTC = new Date(Date.UTC(
    y, mo, d, 
    vn.getHours() - 7, 
    vn.getMinutes(), 
    vn.getSeconds(), 
    vn.getMilliseconds()
  ));
  
  const dow = vn.getDay();
  
  // Nếu đang trong giờ mở cửa (T2-T6, 09:00-16:00)
  if (nowUTC >= openUTC && nowUTC < closeUTC && dow >= 1 && dow <= 5) {
    return 60_000; // Kiểm tra lại sau 1 phút
  }
  
  // Nếu trước giờ mở cửa và là ngày làm việc
  if (nowUTC < openUTC && dow >= 1 && dow <= 5) {
    return openUTC.getTime() - nowUTC.getTime();
  }
  
  // Sau 16:00 hoặc cuối tuần -> nhảy tới 09:00 ngày làm việc kế
  const next = new Date(openUTC);
  do {
    next.setUTCDate(next.getUTCDate() + 1);
  } while ([0, 6].includes(next.getUTCDay()));
  
  return next.getTime() - nowUTC.getTime();
}

/**
 * Format thời gian theo GMT+7
 */
export function formatGmt7(date: Date): string {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format số với dấu phân cách
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

/**
 * Format volume (K/M/B)
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Kiểm tra xem có phải giờ ngoài giờ làm việc không
 */
export function isAfterHours(now = new Date()): boolean {
  const vn = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const dow = vn.getDay();
  if (dow === 0 || dow === 6) return true; // Cuối tuần
  
  const minutes = vn.getHours() * 60 + vn.getMinutes();
  return minutes < 9 * 60 || minutes >= 16 * 60; // Trước 09:00 hoặc sau 16:00
}
