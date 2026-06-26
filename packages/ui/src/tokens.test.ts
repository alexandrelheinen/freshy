import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_NAME, ROUTES } from './tokens';

describe('@freshy/ui tokens', () => {
  it('defines brand name', () => {
    assert.equal(BRAND_NAME, 'Freshy');
  });

  it('defines route helpers', () => {
    assert.equal(ROUTES.explore, '/explore');
    assert.equal(ROUTES.place('demo'), '/places/demo');
  });
});
