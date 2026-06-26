import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_NAME, ROUTES, TYPOGRAPHY_SCALE } from './tokens';

describe('@freshy/ui tokens', () => {
  it('defines brand name', () => {
    assert.equal(BRAND_NAME, 'Freshy');
  });

  it('defines route helpers', () => {
    assert.equal(ROUTES.explore, '/explore');
    assert.equal(ROUTES.place('demo'), '/places/demo');
  });

  it('lists typography scale keys aligned with DESIGN.md', () => {
    assert.deepEqual(TYPOGRAPHY_SCALE, [
      'display-lg',
      'headline-lg',
      'headline-lg-mobile',
      'title-md',
      'body-lg',
      'body-sm',
      'label-caps',
    ]);
  });
});
