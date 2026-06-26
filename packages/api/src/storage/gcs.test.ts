import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isGcsConfigured } from './gcs';

describe('@freshy/api storage', () => {
  it('reports GCS as not configured without env', () => {
    const original = process.env.GCP_PROJECT_ID;
    delete process.env.GCP_PROJECT_ID;
    assert.equal(isGcsConfigured(), false);
    if (original) process.env.GCP_PROJECT_ID = original;
  });
});
