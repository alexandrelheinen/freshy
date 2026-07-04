import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_CARD_FLAT_SCRIM,
  CATEGORY_CARD_GRADIENT_SCRIM,
  CATEGORY_CARD_IMAGE_BASE,
  CATEGORY_CARD_IMAGE_FILTER,
  formatCategoryPlaceCount,
} from './category-card';

describe('formatCategoryPlaceCount', () => {
  it('formats singular count', () => {
    assert.equal(formatCategoryPlaceCount(1), '1 place available');
  });

  it('formats zero count', () => {
    assert.equal(formatCategoryPlaceCount(0), '0 places available');
  });

  it('formats plural count', () => {
    assert.equal(formatCategoryPlaceCount(2), '2 places available');
    assert.equal(formatCategoryPlaceCount(12), '12 places available');
  });
});

describe('category card contrast constants', () => {
  it('exports image base and filter classes', () => {
    assert.equal(CATEGORY_CARD_IMAGE_BASE, 'absolute inset-0 h-full w-full object-cover');
    assert.equal(CATEGORY_CARD_IMAGE_FILTER, 'brightness-[0.72] contrast-[1.15] saturate-[1.02]');
  });

  it('exports flat scrim class', () => {
    assert.equal(CATEGORY_CARD_FLAT_SCRIM, 'absolute inset-0 bg-black/20');
  });

  it('exports gradient scrim class', () => {
    assert.equal(
      CATEGORY_CARD_GRADIENT_SCRIM,
      'absolute inset-0 bg-gradient-to-b from-scrim-strong/75 via-scrim-weak/25 to-scrim-strong',
    );
  });
});
