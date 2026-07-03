import type { FreshnessLevelId } from '@freshy/config/freshness-levels';
import { freshnessLevelScore } from '@freshy/config/freshness-levels';

export const MIN_FRESHNESS_STORAGE_KEY = 'freshy-min-freshness-level';
export const MIN_FRESHNESS_CHANGE_EVENT = 'freshy-min-freshness-change';

export type MinFreshnessFilter = FreshnessLevelId | null;

export function readMinFreshnessFilter(): MinFreshnessFilter {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MIN_FRESHNESS_STORAGE_KEY);
    if (!raw || raw === 'any') return null;
    return raw as FreshnessLevelId;
  } catch {
    return null;
  }
}

export function writeMinFreshnessFilter(value: MinFreshnessFilter): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MIN_FRESHNESS_STORAGE_KEY, value ?? 'any');
    window.dispatchEvent(new CustomEvent(MIN_FRESHNESS_CHANGE_EVENT, { detail: value }));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function minFreshnessScore(level: MinFreshnessFilter): number | undefined {
  if (!level) return undefined;
  const score = freshnessLevelScore(level);
  return score ?? undefined;
}
