import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isR2Configured } from './r2';

describe('@freshy/api storage', () => {
  it('reports R2 as not configured without binding context', () => {
    assert.equal(isR2Configured(null), false);
    assert.equal(isR2Configured(undefined), false);
    assert.equal(isR2Configured({ bucket: {} as R2Bucket, publicBaseUrl: '' }), false);
  });

  it('reports R2 as configured with bucket and public URL', () => {
    assert.equal(
      isR2Configured({ bucket: {} as R2Bucket, publicBaseUrl: 'https://assets.example.com' }),
      true,
    );
  });
});
