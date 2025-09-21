// src/utils/weeklyWindow.ts (ví dụ)
// Range theo tuần VN + neo về tuần mới nhất có data

export type WeeklyWindow = {
  startMs: number;   // inclusive - Mon 09:00 VN
  endMs: number;     // inclusive - Fri 16:00 VN
  allowedDayKeys: number[]; // [YYYYMMDD] theo TZ VN
  source: 'current-week' | 'anchored-to-latest-data';
};

const VN_TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // GMT+7 // ví dụ

/**
 * Convert milliseconds to day key in VN timezone
 * @param ms - Milliseconds epoch
 * @returns YYYYMMDD as number
 */
export function msToDayKeyInVN(ms: number): number {
  const d = new Date(ms + VN_TZ_OFFSET_MS); // ví dụ: convert to VN time
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return Number(`${y}${m}${day}`);
}

// Backward compatibility
const toDayKeyVN = msToDayKeyInVN;

function startOfWeekMon0900(utcMs: number) {
  const d = new Date(utcMs + VN_TZ_OFFSET_MS);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6 // ví dụ
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow, 2, 0, 0)); // 09:00 VN = 02:00 UTC
  return mon.getTime();
}

function endOfWeekFri1600(utcMs: number) {
  const d = new Date(utcMs + VN_TZ_OFFSET_MS);
  const dow = (d.getUTCDay() + 6) % 7;
  const friOffset = 4 - dow; // Fri index=4 // ví dụ
  const fri = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + friOffset, 9, 0, 0)); // 16:00 VN = 09:00 UTC
  return fri.getTime();
}

export function resolveWeeklyWindow(
  data: Array<{ time: number }>, // ví dụ: time là milliseconds UTC+0 từ BE
  nowMs = Date.now()
): WeeklyWindow {
  // 1) window theo tuần hiện tại (GMT+7 09:00–16:00) // ví dụ
  let startMs = startOfWeekMon0900(nowMs);
  let endMs = endOfWeekFri1600(nowMs);

  const inWindow = (t: number) => t >= startMs && t <= endMs; // ví dụ: t là UTC+0

  const hasCurrentWeekData = data?.some(p => inWindow(p.time));

  if (!hasCurrentWeekData && data && data.length > 0) {
    // 2) neo theo dữ liệu mới nhất (không vẽ toàn bộ quá khứ) // ví dụ
    const latest = Math.max(...data.map(d => d.time)); // ví dụ: latest là UTC+0
    if (latest > 0) {
      startMs = startOfWeekMon0900(latest);
      endMs = endOfWeekFri1600(latest);
      return {
        startMs,
        endMs,
        allowedDayKeys: buildAllowedKeys(startMs, endMs),
        source: 'anchored-to-latest-data',
      };
    }
  }

  return {
    startMs,
    endMs,
    allowedDayKeys: buildAllowedKeys(startMs, endMs),
    source: 'current-week',
  };
}

function buildAllowedKeys(startMs: number, endMs: number) {
  const keys: number[] = [];
  for (let d = startMs; d <= endMs; d += 24 * 3600 * 1000) {
    keys.push(msToDayKeyInVN(d)); // ví dụ: use new function
  }
  return keys;
}

// Export các hàm cần thiết cho backward compatibility // ví dụ
export const getYyyymmdd = toDayKeyVN; // ví dụ

export const withinSession = (ms: number): boolean => {
  const d = new Date(ms + VN_TZ_OFFSET_MS); // Convert to VN time // ví dụ
  const hh = d.getUTCHours(), mm = d.getUTCMinutes();
  const t = hh * 60 + mm;
  return t >= 9 * 60 && t <= 16 * 60; // 09:00–16:00 VN // ví dụ
};

export function logWeeklyWindow(ww: WeeklyWindow, componentName: string) {
  console.log(`[weeklyWindow] ${componentName} window`, {
    start: new Date(ww.startMs).toISOString(),
    end: new Date(ww.endMs).toISOString(),
    allowedDayKeys: ww.allowedDayKeys,
    source: ww.source,
  }); // ví dụ
}