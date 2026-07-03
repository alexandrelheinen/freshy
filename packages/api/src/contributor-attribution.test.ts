import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('contributor attribution', () => {
  it('D1 migration defines Place.createdById for contributor tracking', () => {
    const migration = readFileSync(
      path.join(repoRoot, 'packages/db/migrations/0001_init.sql'),
      'utf8',
    );
    assert.match(migration, /"createdById"/);
    assert.match(migration, /Place_createdById_fkey/);
  });

  it('Drizzle schema defines places.createdById', () => {
    const schema = readFileSync(path.join(repoRoot, 'packages/db/src/schema.ts'), 'utf8');
    assert.match(schema, /createdById:\s*text\('createdById'\)/);
  });
});
