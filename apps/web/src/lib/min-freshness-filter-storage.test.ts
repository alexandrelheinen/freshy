import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshnessLevelScore } from '@freshy/config/freshness-levels';
import {
  DEFAULT_MIN_FRESHNESS_FILTER,
  MIN_FRESHNESS_STORAGE_KEY,
  minFreshnessScore,
  readMinFreshnessFilter,
  writeMinFreshnessFilter,
} from './min-freshness-filter-storage';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('min freshness filter storage', () => {
  const previousStorage = globalThis.localStorage;

  beforeEach(() => {
    // @ts-expect-error test shim
    globalThis.localStorage = new MemoryStorage();
  });

  afterEach(() => {
    globalThis.localStorage = previousStorage;
  });

  it('defaults to Modest AC or colder when no preference is stored', () => {
    assert.equal(DEFAULT_MIN_FRESHNESS_FILTER, 'MODEST_AC');
    assert.equal(readMinFreshnessFilter(), 'MODEST_AC');
    assert.equal(minFreshnessScore(readMinFreshnessFilter()), freshnessLevelScore('MODEST_AC'));
  });

  it('keeps an explicit any-freshness preference', () => {
    writeMinFreshnessFilter(null);
    assert.equal(globalThis.localStorage.getItem(MIN_FRESHNESS_STORAGE_KEY), 'any');
    assert.equal(readMinFreshnessFilter(), null);
    assert.equal(minFreshnessScore(null), undefined);
  });

  it('round-trips a stricter chip such as Very Cold AC', () => {
    writeMinFreshnessFilter('VERY_COLD_AC');
    assert.equal(readMinFreshnessFilter(), 'VERY_COLD_AC');
  });
});
