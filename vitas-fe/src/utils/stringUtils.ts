/**
 * Safe string manipulation utilities to prevent undefined/null errors
 */

export function safeToUpperCase(str: string | null | undefined, fallback: string = 'UNKNOWN'): string {
  if (!str || typeof str !== 'string') {
    return fallback;
  }
  return str.toUpperCase();
}

export function safeToLowerCase(str: string | null | undefined, fallback: string = 'unknown'): string {
  if (!str || typeof str !== 'string') {
    return fallback;
  }
  return str.toLowerCase();
}

export function safeCapitalize(str: string | null | undefined, fallback: string = 'Unknown'): string {
  if (!str || typeof str !== 'string') {
    return fallback;
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function safeObjectEntries<T = any>(obj: Record<string, T> | null | undefined): Array<[string, T]> {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.entries(obj);
}

export function safeObjectKeys(obj: Record<string, any> | null | undefined): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.keys(obj);
}

export function safeObjectValues<T = any>(obj: Record<string, T> | null | undefined): T[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.values(obj);
}