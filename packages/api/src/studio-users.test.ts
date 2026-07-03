import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { studioUsersQuerySchema } from './studio-users';

describe('studio-users', () => {
  it('validates studio users query', () => {
    const parsed = studioUsersQuerySchema.safeParse({ q: 'marie@example.com', limit: 10 });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.q, 'marie@example.com');
      assert.equal(parsed.data.limit, 10);
    }
  });
});
