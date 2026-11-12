import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for asynchronous data operations
 * @param {Function} asyncFunction - promise-returning function
 * @param {Array} dependencies - dependency array to re-trigger execution
 * @param {boolean} immediate - execute immediately on mount
 */
export function useFetch(asyncFunction, dependencies = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction(...params);
      setData(result);
      return result;
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat memuat data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [...dependencies, immediate]);

  return {
    data,
    setData,
    loading,
    error,
    refetch: execute
  };
}

export default useFetch;
