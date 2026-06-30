import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthSnapshot, checkDatabaseHealth } from './health';

describe('health', () => {
  it('builds a health snapshot with db status', () => {
    const snapshot = buildHealthSnapshot('ok', true, false);
    assert.deepEqual(snapshot, {
      status: 'ok',
      service: 'freshy-api-worker',
      r2: 'configured',
      auth: 'not-configured',
      db: 'ok',
    });
  });

  it('reports db unavailable when the Place probe fails', async () => {
    const status = await checkDatabaseHealth(async () => {
      throw new Error('column Place.status does not exist');
    });
    assert.equal(status, 'unavailable');
  });

  it('reports db ok when the Place probe succeeds', async () => {
    const status = await checkDatabaseHealth(async () => ({ id: 'place_1' }));
    assert.equal(status, 'ok');
  });
});
