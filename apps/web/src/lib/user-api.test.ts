import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { anonymousPlaceErrorMessage, UNKNOWN_SECRET_MESSAGE } from './user-api';

describe('fetchMyContributorSecret response', () => {
  it('reads the secret from the API payload', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: { secret: 'usr_test_secret' } }), { status: 200 });

    const { fetchMyContributorSecret } = await import('./user-api');
    const secret = await fetchMyContributorSecret(async () => 'token');
    assert.equal(secret, 'usr_test_secret');

    globalThis.fetch = originalFetch;
  });
});

describe('anonymousPlaceErrorMessage', () => {
  it('returns the API message for unknown secrets', () => {
    assert.equal(
      anonymousPlaceErrorMessage(400, {
        error: 'UNKNOWN_SECRET',
        message: UNKNOWN_SECRET_MESSAGE,
      }),
      UNKNOWN_SECRET_MESSAGE,
    );
  });

  it('returns the API message for missing secrets', () => {
    assert.equal(
      anonymousPlaceErrorMessage(400, {
        error: 'MISSING_SECRET',
        message: UNKNOWN_SECRET_MESSAGE,
      }),
      UNKNOWN_SECRET_MESSAGE,
    );
  });
});
