"use client";

import { useEffect, useMemo, useState } from "react";

const ONE_MINUTE_MS = 60_000;
const ONE_HOUR_MS = 3_600_000;

function resolveRefreshDelayMs(timestamps: Array<string>, nowMs: number): number {
  if (timestamps.length === 0) {
    return ONE_MINUTE_MS;
  }

  let hasRecent = false;
  let hasWithinHour = false;

  for (let i = 0; i < timestamps.length; i++) {
    const createdAtMs = new Date(timestamps[i]).getTime();
    const diff = Math.max(0, nowMs - createdAtMs);

    if (diff < ONE_MINUTE_MS) {
      hasRecent = true;
      break;
    }

    if (diff < ONE_HOUR_MS) {
      hasWithinHour = true;
    }
  }

  if (hasRecent) {
    return 1000;
  }

  if (hasWithinHour) {
    return ONE_MINUTE_MS;
  }

  return 5 * ONE_MINUTE_MS;
}

export function useLiveTimeTicker(timestamps: Array<string>): number {
  const [tickMs, setTickMs] = useState<number>(() => Date.now());

  const normalizedTimestamps = useMemo(() => timestamps.filter(Boolean), [timestamps]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const scheduleNext = () => {
      if (isDisposed) {
        return;
      }

      const nowMs = Date.now();
      const delay = resolveRefreshDelayMs(normalizedTimestamps, nowMs);

      timeoutId = setTimeout(() => {
        setTickMs(Date.now());
        scheduleNext();
      }, delay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setTickMs(Date.now());
      }
    };

    scheduleNext();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isDisposed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [normalizedTimestamps]);

  return tickMs;
}
