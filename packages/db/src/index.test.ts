import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('@freshy/db', () => {
  it('exports Prisma types', async () => {
    const db = await import('../src/index');
    assert.equal(typeof db.PrismaClient, 'function');
  });
});
