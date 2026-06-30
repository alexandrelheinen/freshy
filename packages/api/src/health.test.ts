import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthSnapshot, checkDatabaseHealth } from './health';

describe('health', () => {
  it('builds a health snapshot with db status', () => {
    const snapshot = buildHealthSnapshot('ok', true, false);
    assert.deepEqual(snapshot, {
      status: 'ok',
      service: 'freshy-api',
      r2: 'configured',
      auth: 'not-configured',
      db: 'ok',
    });
  });

  it('reports db unavailable when the probe query fails', async () => {
    const status = await checkDatabaseHealth(async () => {
      throw new Error('connection refused');
    });
    assert.equal(status, 'unavailable');
  });

  it('reports db ok when the probe query succeeds', async () => {
    const status = await checkDatabaseHealth(async () => 1);
    assert.equal(status, 'ok');
  });
});
