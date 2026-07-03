'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FreshnessLevelId } from '@freshy/config/freshness-levels';
import {
  MIN_FRESHNESS_CHANGE_EVENT,
  readMinFreshnessFilter,
  writeMinFreshnessFilter,
  type MinFreshnessFilter,
} from './min-freshness-filter-storage';

export function useMinFreshnessFilter(): {
  minFreshnessLevel: MinFreshnessFilter;
  setMinFreshnessLevel: (value: MinFreshnessFilter) => void;
} {
  const [minFreshnessLevel, setMinFreshnessLevelState] = useState<MinFreshnessFilter>(() =>
    readMinFreshnessFilter(),
  );

  useEffect(() => {
    const handler = (event: Event) => {
      setMinFreshnessLevelState((event as CustomEvent<MinFreshnessFilter>).detail ?? null);
    };
    window.addEventListener(MIN_FRESHNESS_CHANGE_EVENT, handler);
    return () => window.removeEventListener(MIN_FRESHNESS_CHANGE_EVENT, handler);
  }, []);

  const setMinFreshnessLevel = useCallback((value: FreshnessLevelId | null) => {
    writeMinFreshnessFilter(value);
    setMinFreshnessLevelState(value);
  }, []);

  return { minFreshnessLevel, setMinFreshnessLevel };
}
