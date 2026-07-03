import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNKNOWN_SECRET_MESSAGE,
  contributorErrorResponse,
  resolveContributorFromSecret,
} from './contributor-resolve';

describe('contributor-resolve', () => {
  it('returns MISSING_SECRET when secret is empty', async () => {
    const db = {} as Parameters<typeof resolveContributorFromSecret>[0];
    const result = await resolveContributorFromSecret(db, '   ');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'MISSING_SECRET');
      assert.equal(result.message, UNKNOWN_SECRET_MESSAGE);
    }
  });

  it('returns UNKNOWN_SECRET when user is not found', async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      }),
    } as unknown as Parameters<typeof resolveContributorFromSecret>[0];

    const result = await resolveContributorFromSecret(db, 'missing-user-id');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'UNKNOWN_SECRET');
      assert.equal(result.message, UNKNOWN_SECRET_MESSAGE);
    }
  });

  it('builds API error payload for unknown secret', () => {
    assert.deepEqual(contributorErrorResponse('UNKNOWN_SECRET', UNKNOWN_SECRET_MESSAGE), {
      error: 'UNKNOWN_SECRET',
      message: UNKNOWN_SECRET_MESSAGE,
    });
  });
});
