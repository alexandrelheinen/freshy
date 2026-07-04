import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { readAppVersion } from './read-app-version';

describe('readAppVersion', () => {
  const original = process.env.FRESHY_RELEASE_VERSION;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FRESHY_RELEASE_VERSION;
    } else {
      process.env.FRESHY_RELEASE_VERSION = original;
    }
  });

  it('strips a leading v from release env vars', () => {
    process.env.FRESHY_RELEASE_VERSION = 'v0.3.2';
    assert.equal(readAppVersion(), '0.3.2');
  });

  it('accepts release tags without a v prefix', () => {
    process.env.FRESHY_RELEASE_VERSION = '0.3.2';
    assert.equal(readAppVersion(), '0.3.2');
  });

  it('falls back to package.json when no release env var is set', () => {
    delete process.env.FRESHY_RELEASE_VERSION;
    assert.equal(readAppVersion(), '0.3.2');
  });
});
