import { useEffect, useRef } from "react";

/**
 * Calls `callback` immediately, then repeats every `intervalMs`.
 * Cleans up on unmount or when deps change.
 */
export function usePolling(callback: () => void, intervalMs: number) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    callback();
    intervalRef.current = setInterval(callback, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [callback, intervalMs]);
}
