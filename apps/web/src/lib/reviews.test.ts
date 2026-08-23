import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REVIEW_PAGE_SIZE,
  buildReviewsSearchParams,
  reviewCoolnessLabel,
  reviewPageCount,
} from './reviews';

describe('review helpers', () => {
  it('uses five reviews per page', () => {
    assert.equal(REVIEW_PAGE_SIZE, 5);
    assert.equal(reviewPageCount(12), 3);
    assert.equal(reviewPageCount(5), 1);
  });

  it('builds paginated review query params', () => {
    const search = buildReviewsSearchParams({ page: 2, q: '  cafe  ', placeId: 'place_1' });
    assert.equal(search.get('page'), '2');
    assert.equal(search.get('limit'), '5');
    assert.equal(search.get('q'), 'cafe');
    assert.equal(search.get('placeId'), 'place_1');
  });

  it('labels coolness from the 1-5 review scale', () => {
    assert.equal(reviewCoolnessLabel(5), 'Frigid');
    assert.equal(reviewCoolnessLabel(3), 'Comfortable');
    assert.equal(reviewCoolnessLabel(1), 'Cooled');
  });
});
