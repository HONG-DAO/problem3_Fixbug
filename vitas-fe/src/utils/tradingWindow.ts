const TZ = 'Asia/Ho_Chi_Minh';

function toVN(d = new Date()) {
  return new Date(d.toLocaleString('en-US', { timeZone: TZ }));
}

/**
 * Trả về [min,max] (ms) cho tuần hiện tại:
 * min = 00:00:00 thứ 2; max = 23:59:59 của "ngày mới nhất" (T6 nếu weekend, ngược lại là hôm nay)
 */
export function getWeeklyClamp(now = new Date()) {
  const vn = toVN(now);
  let dow = vn.getDay(); // 0=CN,1=T2,...,6=T7
  
  // Tìm thứ 2 của tuần
  const diffToMon = (dow + 6) % 7; // T2 ->0, T3 ->1, ..., CN ->6
  const mon = new Date(vn); 
  mon.setHours(0, 0, 0, 0); 
  mon.setDate(mon.getDate() - diffToMon);

  // Xác định "ngày mới nhất" (Fri nếu weekend, else today)
  let last = new Date(vn); 
  last.setHours(23, 59, 59, 999);
  
  if (dow === 0) { // CN
    last = new Date(vn); 
    last.setDate(last.getDate() - 2); 
    last.setHours(23, 59, 59, 999); // T6
  } else if (dow === 6) { // T7
    last = new Date(vn); 
    last.setDate(last.getDate() - 1); 
    last.setHours(23, 59, 59, 999); // T6
  }

  return { min: mon.getTime(), max: last.getTime() };
}

/**
 * Kiểm tra xem một timestamp có nằm trong cửa sổ tuần hiện tại không
 */
export function isInWeeklyWindow(timestamp: number | string, now = new Date()): boolean {
  const clamp = getWeeklyClamp(now);
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  return ts >= clamp.min && ts <= clamp.max;
}

/**
 * Lọc dữ liệu theo cửa sổ tuần
 */
export function filterByWeeklyWindow<T extends { t: number | string }>(
  data: T[], 
  now = new Date()
): T[] {
  const clamp = getWeeklyClamp(now);
  return data.filter(item => {
    const ts = typeof item.t === 'number' ? item.t : new Date(item.t).getTime();
    return ts >= clamp.min && ts <= clamp.max;
  });
}

/**
 * Format clamp cho logging
 */
export function formatClampForLog(clamp: { min: number; max: number }) {
  return {
    minISO: new Date(clamp.min).toISOString(),
    maxISO: new Date(clamp.max).toISOString(),
    minLocal: new Date(clamp.min).toLocaleString('vi-VN', { timeZone: TZ }),
    maxLocal: new Date(clamp.max).toLocaleString('vi-VN', { timeZone: TZ }),
  };
}
