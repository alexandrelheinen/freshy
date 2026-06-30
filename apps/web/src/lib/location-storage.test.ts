import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAP_CENTER_STORAGE_KEY,
  USER_GPS_STORAGE_KEY,
  readStoredMapCenter,
  readStoredUserGps,
  writeStoredMapCenter,
  writeStoredUserGps,
} from './location-storage';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('location storage', () => {
  const previousStorage = globalThis.sessionStorage;

  beforeEach(() => {
    // @ts-expect-error test shim
    globalThis.sessionStorage = new MemoryStorage();
  });

  afterEach(() => {
    globalThis.sessionStorage = previousStorage;
  });

  it('round-trips map center', () => {
    writeStoredMapCenter({ lat: 48.9, lng: 2.3, zoom: 12.5 });
    assert.deepEqual(readStoredMapCenter(), { lat: 48.9, lng: 2.3, zoom: 12.5 });
    assert.ok(globalThis.sessionStorage.getItem(MAP_CENTER_STORAGE_KEY));
  });

  it('round-trips user gps', () => {
    writeStoredUserGps({ lat: 48.91, lng: 2.31 });
    assert.deepEqual(readStoredUserGps(), { lat: 48.91, lng: 2.31 });
    assert.ok(globalThis.sessionStorage.getItem(USER_GPS_STORAGE_KEY));
  });

  it('returns null for invalid stored map center', () => {
    globalThis.sessionStorage.setItem(MAP_CENTER_STORAGE_KEY, '{"lat":"bad"}');
    assert.equal(readStoredMapCenter(), null);
  });
});
