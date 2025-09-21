import { createLogger } from './logger';

const log = createLogger('aggregate:1m');

export interface MinBar {
  t: number | string; // timestamp
  o: number;      // open
  h: number;      // high
  l: number;      // low
  c: number;      // close
  v: number;      // volume
}

export interface AggBar {
  t: number;      // timestamp (anchor)
  o: number;      // open (first bar)
  h: number;      // high (max)
  l: number;      // low (min)
  c: number;      // close (last bar)
  v: number;      // volume (sum)
}

/**
 * Kiểm tra xem timestamp có phải là mốc giờ chẵn (10:00, 11:00, ...) không
 */
export function isExactHourAnchor(timestamp: number): boolean {
  const date = new Date(timestamp);
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  
  return minutes === 0 && seconds === 0 && milliseconds === 0;
}

/**
 * Kiểm tra xem timestamp có phải là mốc đóng cửa ngày (16:00) không
 */
export function isExactDayCloseAnchor(timestamp: number): boolean {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  
  return hours === 16 && minutes === 0 && seconds === 0 && milliseconds === 0;
}

/**
 * Tìm mốc giờ chẵn gần nhất (trước hoặc tại timestamp)
 */
export function findHourAnchor(timestamp: number): number {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0); // Reset về đầu giờ
  return date.getTime();
}

/**
 * Tìm mốc đóng cửa ngày gần nhất (trước hoặc tại timestamp)
 */
export function findDayCloseAnchor(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(16, 0, 0, 0); // Set về 16:00
  return date.getTime();
}

/**
 * Aggregate dữ liệu 1m thành 1h/1d
 */
export function aggregateFrom1m(
  bars1m: MinBar[], 
  interval: '1h' | '1d'
): Map<number, AggBar> {
  const aggMap = new Map<number, AggBar>();
  
  if (!bars1m?.length) {
    log.warn('aggregateFrom1m: no 1m data provided');
    return aggMap;
  }

  log.info('aggregateFrom1m:start', { 
    inputBars: bars1m.length, 
    interval 
  });

  // Group bars by anchor
  const groups = new Map<number, MinBar[]>();
  
  for (const bar of bars1m) {
    const timestamp = typeof bar.t === 'number' ? bar.t : new Date(bar.t).getTime();
    let anchor: number;
    
    if (interval === '1h') {
      anchor = findHourAnchor(timestamp);
    } else if (interval === '1d') {
      anchor = findDayCloseAnchor(timestamp);
    } else {
      continue; // Skip unsupported intervals
    }
    
    if (!groups.has(anchor)) {
      groups.set(anchor, []);
    }
    groups.get(anchor)!.push(bar);
  }

  // Aggregate each group
  for (const [anchor, bars] of groups) {
    if (!bars.length) continue;
    
    // Sort by timestamp
    bars.sort((a, b) => {
      const ta = typeof a.t === 'number' ? a.t : new Date(a.t).getTime();
      const tb = typeof b.t === 'number' ? b.t : new Date(b.t).getTime();
      return ta - tb;
    });
    
    const firstBar = bars[0];
    const lastBar = bars[bars.length - 1];
    
    const aggBar: AggBar = {
      t: anchor,
      o: firstBar.o,
      h: Math.max(...bars.map(b => b.h)),
      l: Math.min(...bars.map(b => b.l)),
      c: lastBar.c,
      v: bars.reduce((sum, b) => sum + b.v, 0),
    };
    
    aggMap.set(anchor, aggBar);
  }

  log.info('aggregateFrom1m:done', { 
    outputBars: aggMap.size,
    anchors: Array.from(aggMap.keys()).map(t => new Date(t).toISOString())
  });

  return aggMap;
}

/**
 * Kiểm tra xem có đủ dữ liệu 1m để aggregate cho anchor không
 */
export function hasEnoughDataForAnchor(
  bars1m: MinBar[], 
  anchor: number, 
  interval: '1h' | '1d'
): boolean {
  if (!bars1m?.length) return false;
  
  const expectedBars = interval === '1h' ? 60 : 390; // 60 phút hoặc 6.5 giờ
  const anchorStart = anchor;
  const anchorEnd = interval === '1h' 
    ? anchor + 60 * 60 * 1000  // +1 hour
    : anchor + 6.5 * 60 * 60 * 1000; // +6.5 hours
  
  const relevantBars = bars1m.filter(bar => {
    const timestamp = typeof bar.t === 'number' ? bar.t : new Date(bar.t).getTime();
    return timestamp >= anchorStart && timestamp < anchorEnd;
  });
  
  const hasEnough = relevantBars.length >= expectedBars * 0.8; // 80% threshold
  
  log.debug('hasEnoughDataForAnchor', {
    anchor: new Date(anchor).toISOString(),
    interval,
    expected: expectedBars,
    actual: relevantBars.length,
    hasEnough
  });
  
  return hasEnough;
}
