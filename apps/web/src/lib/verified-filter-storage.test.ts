import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VERIFIED_ONLY,
  VERIFIED_ONLY_STORAGE_KEY,
  readVerifiedOnlyFilter,
  writeVerifiedOnlyFilter,
} from './verified-filter-storage';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('verified-only filter storage', () => {
  const previousStorage = globalThis.localStorage;

  beforeEach(() => {
    // @ts-expect-error test shim
    globalThis.localStorage = new MemoryStorage();
  });

  afterEach(() => {
    globalThis.localStorage = previousStorage;
  });

  it('defaults to verified-only when no preference is stored', () => {
    assert.equal(DEFAULT_VERIFIED_ONLY, true);
    assert.equal(readVerifiedOnlyFilter(), true);
  });

  it('keeps an explicit off preference so unverified places can be shown', () => {
    writeVerifiedOnlyFilter(false);
    assert.equal(globalThis.localStorage.getItem(VERIFIED_ONLY_STORAGE_KEY), 'false');
    assert.equal(readVerifiedOnlyFilter(), false);
  });

  it('round-trips an on preference', () => {
    writeVerifiedOnlyFilter(true);
    assert.equal(readVerifiedOnlyFilter(), true);
  });
});
