import { useState, useEffect, useMemo, useRef } from 'react';
import type { BaseResponse, ApiError } from '../types/api';
import { createLogger } from '../utils/logger';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false;
  return true;
}

export function useApi<T>(
  apiCall: () => Promise<BaseResponse<T>>,
  dependencies: unknown[] = []
): UseApiState<T> {
  const log = createLogger(`useApi:${dependencies.join(':')}`);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const stableApiCall = useMemo(() => apiCall, dependencies);
  const stableDeps = useMemo(() => dependencies, dependencies);

  const mountedRef = useRef(true);
  const lastSnapRef = useRef<any>(null);

  useEffect(() => { 
    mountedRef.current = true; 
    return () => { 
      mountedRef.current = false; 
    }; 
  }, []);

  const fetchData = async () => {
    const ac = new AbortController(); 
    let cancelled = false;
    
    try {
      setLoading(true); 
      setError(null);
      log.info('fetch:start');
      const t0 = performance.now();
      const response = await stableApiCall();
      const t1 = performance.now();
      
      if (cancelled || ac.signal.aborted || !mountedRef.current) { 
        log.warn('fetch:cancelled/aborted'); 
        return; 
      }

      // Log tóm tắt dữ liệu
      log.group(`fetch:ok (${(t1 - t0).toFixed(1)}ms)`, () => {
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            const len = response.data.length;
            const head = response.data[0]; 
            const tail = response.data[len - 1];
            console.info('length', len);
            console.info('head', head);
            console.info('tail', tail);
            if (len) console.table([head, tail]);
          } else {
            console.info('payload', response.data);
          }
        } else {
          console.info('response', { success: response.success, message: response.message });
        }
      });

      if (response.success) {
        const newData = response.data || null;
        if (!shallowEqual(lastSnapRef.current, newData)) {
          lastSnapRef.current = newData;
          setData(newData);
          log.info('state:setData (changed)');
        } else {
          log.info('state:skip (no changes)');
        }
      } else {
        const apiError = {
          message: response.message || 'API call failed',
        };
        setError(apiError);
        log.error('api:error', apiError);
      }
    } catch (err) {
      log.error('fetch:error', err);
      if (!cancelled && !ac.signal.aborted && mountedRef.current) {
        setError(err as ApiError);
      }
    } finally {
      if (!cancelled && !ac.signal.aborted && mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [stableApiCall, ...stableDeps]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useApiMutation<T, P = unknown>(
  apiCall: (params: P) => Promise<BaseResponse<T>>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(params);
      
      if (response.success) {
        setData(response.data || null);
        return response.data;
      } else {
        setError({
          message: response.message || 'API call failed',
        });
        return null;
      }
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
  };
}
