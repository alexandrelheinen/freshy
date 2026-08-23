import type { FreshnessLevelId } from '@freshy/config/freshness-levels';
import { freshnessLevelScore } from '@freshy/config/freshness-levels';

export const MIN_FRESHNESS_STORAGE_KEY = 'freshy-min-freshness-level';
export const MIN_FRESHNESS_CHANGE_EVENT = 'freshy-min-freshness-change';

export type MinFreshnessFilter = FreshnessLevelId | null;

/** First visit and missing storage: Modest AC or colder. */
export const DEFAULT_MIN_FRESHNESS_FILTER: FreshnessLevelId = 'MODEST_AC';

function localStorageRef(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }
  return null;
}

export function readMinFreshnessFilter(): MinFreshnessFilter {
  const storage = localStorageRef();
  if (!storage) return DEFAULT_MIN_FRESHNESS_FILTER;
  try {
    const raw = storage.getItem(MIN_FRESHNESS_STORAGE_KEY);
    if (raw === null) return DEFAULT_MIN_FRESHNESS_FILTER;
    if (raw === 'any') return null;
    return raw as FreshnessLevelId;
  } catch {
    return DEFAULT_MIN_FRESHNESS_FILTER;
  }
}

export function writeMinFreshnessFilter(value: MinFreshnessFilter): void {
  const storage = localStorageRef();
  if (!storage) return;
  try {
    storage.setItem(MIN_FRESHNESS_STORAGE_KEY, value ?? 'any');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(MIN_FRESHNESS_CHANGE_EVENT, { detail: value }));
    }
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function minFreshnessScore(level: MinFreshnessFilter): number | undefined {
  if (!level) return undefined;
  const score = freshnessLevelScore(level);
  return score ?? undefined;
}
