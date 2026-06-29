import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isR2Configured } from './r2';

describe('@freshy/api storage', () => {
  it('reports R2 as not configured without env', () => {
    const keys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const;
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    for (const key of keys) {
      delete process.env[key];
    }
    assert.equal(isR2Configured(), false);
    for (const key of keys) {
      if (saved[key]) process.env[key] = saved[key];
    }
  });
});
