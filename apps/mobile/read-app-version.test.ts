import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { readAppVersion } = require('./read-app-version.cjs') as {
  readAppVersion: () => string;
};

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
