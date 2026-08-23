import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REVIEW_PAGE_SIZE,
  createReviewSchema,
  reviewsQuerySchema,
  serializePlaceReview,
  studioReviewsQuerySchema,
  toReviewPage,
  upsertReviewSchema,
} from './reviews';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('reviewsQuerySchema', () => {
  it('defaults to five reviews per page', () => {
    const parsed = reviewsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, REVIEW_PAGE_SIZE);
    assert.equal(REVIEW_PAGE_SIZE, 5);
  });

  it('rejects a page size above twenty', () => {
    const parsed = reviewsQuerySchema.safeParse({ limit: '50' });
    assert.equal(parsed.success, false);
  });
});

describe('studioReviewsQuerySchema', () => {
  it('defaults studio review lists to twenty-five rows', () => {
    const parsed = studioReviewsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 25);
  });

  it('accepts a search query', () => {
    const parsed = studioReviewsQuerySchema.parse({ q: ' offensive ', page: '2' });
    assert.equal(parsed.q, 'offensive');
    assert.equal(parsed.page, 2);
  });
});

describe('createReviewSchema', () => {
  it('accepts a 1-5 coolness rating and optional comment', () => {
    const parsed = createReviewSchema.parse({ acStrength: '4', comment: '  Very cold  ' });
    assert.equal(parsed.acStrength, 4);
    assert.equal(parsed.comment, 'Very cold');
  });

  it('allows an empty comment', () => {
    const parsed = createReviewSchema.parse({ acStrength: 2 });
    assert.equal(parsed.acStrength, 2);
    assert.equal(parsed.comment, null);
  });

  it('rejects a rating outside 1-5', () => {
    assert.equal(createReviewSchema.safeParse({ acStrength: 0 }).success, false);
    assert.equal(createReviewSchema.safeParse({ acStrength: 6 }).success, false);
  });

  it('requires a place id when creating or updating a review', () => {
    const parsed = upsertReviewSchema.parse({
      placeId: 'place_1',
      acStrength: 3,
      comment: 'Nice AC',
    });
    assert.equal(parsed.placeId, 'place_1');
    assert.equal(upsertReviewSchema.safeParse({ acStrength: 3 }).success, false);
  });
});

describe('serializePlaceReview', () => {
  it('includes the reviewer name and avatar', () => {
    const review = serializePlaceReview({
      id: 'rev_1',
      acStrength: 4,
      comment: 'Cold enough',
      createdAt: '2026-08-01T12:00:00.000Z',
      displayName: 'Marie Dupont',
      username: 'marie',
      avatarUrl: 'https://img.example/marie.jpg',
    });

    assert.equal(review.user.displayName, 'Marie Dupont');
    assert.equal(review.user.username, 'marie');
    assert.equal(review.user.avatarUrl, 'https://img.example/marie.jpg');
  });
});

describe('toReviewPage', () => {
  it('slices items to five per page and reports totals', () => {
    const items = Array.from({ length: 12 }, (_, index) => index + 1);
    const page = toReviewPage(items, { page: 2, limit: 5 });
    assert.deepEqual(page.items, [6, 7, 8, 9, 10]);
    assert.equal(page.total, 12);
    assert.equal(page.page, 2);
    assert.equal(page.limit, 5);
  });
});

describe('review uniqueness', () => {
  it('Drizzle schema enforces one review per user and place', () => {
    const schema = readFileSync(path.join(repoRoot, 'packages/db/src/schema.ts'), 'utf8');
    assert.match(schema, /Review_userId_placeId_key/);
  });

  it('D1 migration adds the unique user and place index', () => {
    const migration = readFileSync(
      path.join(repoRoot, 'packages/db/migrations/0003_review_user_place_unique.sql'),
      'utf8',
    );
    assert.match(migration, /Review_userId_placeId_key/);
    assert.match(migration, /UNIQUE INDEX/i);
  });
});
