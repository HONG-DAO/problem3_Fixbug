type Level = 'debug'|'info'|'warn'|'error';
const ENABLED = import.meta.env.VITE_DEBUG_LOGS === '1' || import.meta.env.MODE !== 'production';

export const createLogger = (ns: string) => {
  const tag = (level: Level) => [`[%s][%s]`, new Date().toISOString(), `${ns}:${level}`];
  return {
    debug: (...a: any[]) => ENABLED && console.debug(...tag('debug'), ...a),
    info:  (...a: any[]) => ENABLED && console.info (...tag('info'),  ...a),
    warn:  (...a: any[]) => ENABLED && console.warn (...tag('warn'),  ...a),
    error: (...a: any[]) => ENABLED && console.error(...tag('error'), ...a),
    group: (title: string, cb: () => void) => {
      if (!ENABLED) return;
      console.groupCollapsed(`[${ns}] ${title}`); try { cb(); } finally { console.groupEnd(); }
    },
  };
};
