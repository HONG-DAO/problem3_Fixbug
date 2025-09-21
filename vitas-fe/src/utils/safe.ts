/**
 * Safe utilities to prevent "Cannot read properties of undefined/null" errors
 * Provides type guards, safe casting, and safe operations for common patterns
 */

// Guard kiểu cơ bản
export const isStr = (v: unknown): v is string => typeof v === 'string';
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
export const isArr = (v: unknown): v is any[] => Array.isArray(v);
export const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// Ép kiểu có mặc định
export const asStr = (v: unknown, fb = ''): string => isStr(v) ? v : (v == null ? fb : String(v));
export const asNum = (v: unknown, fb = 0): number => { 
  const n = Number(v); 
  return Number.isFinite(n) ? n : fb; 
};
export const asBool = (v: unknown, fb = false): boolean => {
  if (typeof v === 'boolean') return v; // ví dụ: handle boolean directly
  if (v == null) return fb; // ví dụ: handle null/undefined
  const s = String(v).trim().toLowerCase(); // ví dụ: safe string conversion
  if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
  return fb; // ví dụ: fallback for unrecognized values
};
export const asArrT = <T = unknown>(v: unknown, fb: T[] = [] as T[]): T[] => isArr(v) ? (v as T[]) : fb;
export const asObjT = <T extends object = Record<string, unknown>>(v: unknown, fb = {} as T): T => isObj(v) ? (v as T) : fb;

// Safe cho string operations
export const safeUpper = (v: unknown, fb = ''): string => asStr(v, fb).toUpperCase();
export const safeLower = (v: unknown, fb = ''): string => asStr(v, fb).toLowerCase();
export const safeTrim = (v: unknown, fb = ''): string => asStr(v, fb).trim();
export const safeSplit = (v: unknown, sep: string | RegExp, fb: string[] = []): string[] => {
  const s = asStr(v, null as any); 
  return s == null ? fb : s.split(sep);
};
export const safeIncludes = (v: unknown, q: string): boolean => asStr(v, '').includes(q);
export const safeStartsWith = (v: unknown, q: string): boolean => asStr(v, '').startsWith(q);
export const safeEndsWith = (v: unknown, q: string): boolean => asStr(v, '').endsWith(q);

// Safe số/format
export const safeToFixed = (v: unknown, d = 2, fb = '0'): string => {
  const n = asNum(v, NaN); 
  return Number.isFinite(n) ? n.toFixed(d) : fb;
};

// Safe array operations
export const safeMap = <T, R>(arr: unknown, fn: (x: T, i: number, a: T[]) => R, fb: R[] = []): R[] =>
  asArrT<T>(arr).map(fn) ?? fb;
export const safeFilter = <T>(arr: unknown, fn: (x: T, i: number, a: T[]) => boolean, fb: T[] = []): T[] =>
  asArrT<T>(arr).filter(fn) ?? fb;
export const safeReduce = <T, R>(arr: unknown, fn: (acc: R, x: T, i: number, a: T[]) => R, init: R): R =>
  asArrT<T>(arr).reduce(fn, init);

// Safe truy cập sâu theo path
export function get<T = unknown>(obj: unknown, path: (string | number)[], fb: T): T {
  let cur: any = obj;
  for (const key of path) {
    if (cur == null) return fb;
    cur = cur[key as any];
  }
  return (cur ?? fb) as T;
}

// Safe Date
export const asDate = (v: unknown, fb = new Date(0)): Date => {
  const d = new Date(asNum(v, NaN) || asStr(v, '')); 
  return isNaN(d.getTime()) ? fb : d;
};

// Fallback tiện dụng
export const def = <T>(v: T | null | undefined, fb: T): T => (v ?? fb);

// Safe length operations
export const safeLength = (v: unknown, fb = 0): number => {
  if (isArr(v)) return v.length;
  if (isStr(v)) return v.length;
  return fb;
};

// Safe slice operations
export const safeSlice = (v: unknown, start: number, end?: number, fb: any[] = []): any[] => {
  if (isArr(v)) return v.slice(start, end);
  return fb;
};

// Safe join operations
export const safeJoin = (v: unknown, sep = ',', fb = ''): string => {
  if (isArr(v)) return v.join(sep);
  return fb;
};

// Safe find operations
export const safeFind = <T>(arr: unknown, fn: (x: T, i: number, a: T[]) => boolean, fb: T | undefined = undefined): T | undefined => {
  return asArrT<T>(arr).find(fn) ?? fb;
};

// Safe some/every operations
export const safeSome = <T>(arr: unknown, fn: (x: T, i: number, a: T[]) => boolean, fb = false): boolean => {
  return asArrT<T>(arr).some(fn) ?? fb;
};

export const safeEvery = <T>(arr: unknown, fn: (x: T, i: number, a: T[]) => boolean, fb = true): boolean => {
  return asArrT<T>(arr).every(fn) ?? fb;
};
