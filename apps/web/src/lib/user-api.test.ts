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

  it('falls back to profile id when the contributor-secret route is missing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith('/users/me/contributor-secret')) {
        return new Response('Not Found', { status: 404 });
      }
      if (path.endsWith('/users/me')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 'usr_profile_fallback',
              email: 'creator@example.com',
              displayName: 'Creator',
              username: 'creator',
              avatarUrl: null,
              reliefPoints: 0,
              reviewCount: 0,
              savedCount: 0,
            },
          }),
          { status: 200 },
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const { fetchMyContributorSecret } = await import('./user-api');
    const secret = await fetchMyContributorSecret(async () => 'token');
    assert.equal(secret, 'usr_profile_fallback');

    globalThis.fetch = originalFetch;
  });
});

describe('fetchMyReviews', () => {
  it('reads a paginated review page from the API', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: {
            items: [
              {
                id: 'rev_1',
                comment: 'Cold enough',
                acStrength: 4,
                createdAt: '2026-08-01T12:00:00.000Z',
                place: { id: 'p1', slug: 'cool-cafe', name: 'Cool Cafe', category: 'CAFE' },
              },
            ],
            total: 6,
            page: 2,
            limit: 5,
          },
        }),
        { status: 200 },
      );

    const { fetchMyReviews } = await import('./user-api');
    const page = await fetchMyReviews(async () => 'token', { page: 2 });
    assert.equal(page.total, 6);
    assert.equal(page.page, 2);
    assert.equal(page.items[0]?.place.name, 'Cool Cafe');

    globalThis.fetch = originalFetch;
  });
});

describe('anonymousPlaceErrorMessage', () => {
  it('returns a clear message when the contributions route is missing', () => {
    assert.match(anonymousPlaceErrorMessage(404, {}), /unavailable/i);
    assert.match(anonymousPlaceErrorMessage(404, {}), /contributions\/places/i);
  });

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
