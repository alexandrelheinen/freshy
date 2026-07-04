import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CATEGORY_THUMB_GRADIENT_CLASS,
  CATEGORY_THUMB_IMAGE_CLASS,
  CATEGORY_THUMB_SCRIM_CLASS,
  formatCategoryPlaceCount,
} from './category-card';

describe('formatCategoryPlaceCount', () => {
  it('uses singular copy for one place', () => {
    assert.equal(formatCategoryPlaceCount(1), '1 place available');
  });

  it('uses plural copy for multiple places', () => {
    assert.equal(formatCategoryPlaceCount(0), '0 places available');
    assert.equal(formatCategoryPlaceCount(2), '2 places available');
  });
});

describe('category thumb contrast classes', () => {
  it('exports the shared image filter classes', () => {
    assert.match(CATEGORY_THUMB_IMAGE_CLASS, /brightness-\[0\.72\]/);
    assert.match(CATEGORY_THUMB_IMAGE_CLASS, /contrast-\[1\.15\]/);
    assert.match(CATEGORY_THUMB_IMAGE_CLASS, /saturate-\[1\.02\]/);
  });

  it('exports the shared scrim overlay classes', () => {
    assert.equal(CATEGORY_THUMB_SCRIM_CLASS, 'absolute inset-0 bg-black/20');
  });

  it('exports the shared gradient overlay classes', () => {
    assert.equal(
      CATEGORY_THUMB_GRADIENT_CLASS,
      'absolute inset-0 bg-gradient-to-b from-scrim-strong/75 via-scrim-weak/25 to-scrim-strong',
    );
  });
});
