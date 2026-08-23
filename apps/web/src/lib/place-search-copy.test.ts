import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_PLACE_SEARCH_COPY, STUDIO_PLACE_SEARCH_COPY } from './place-search-copy';

describe('place search copy', () => {
  it('uses a name-only prompt on category lists', () => {
    assert.match(CATEGORY_PLACE_SEARCH_COPY.placeholder, /name/i);
    assert.match(CATEGORY_PLACE_SEARCH_COPY.ariaLabel, /name/i);
    assert.doesNotMatch(CATEGORY_PLACE_SEARCH_COPY.placeholder, /slug|ID/i);
  });

  it('keeps the broader Studio search prompt', () => {
    assert.match(STUDIO_PLACE_SEARCH_COPY.placeholder, /name/i);
    assert.match(STUDIO_PLACE_SEARCH_COPY.placeholder, /address/i);
  });
});
