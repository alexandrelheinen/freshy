import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isStudioAdmin, normalizeStudioPlaceTags } from './studio-api';

describe('studio-api', () => {
  it('detects studio admin metadata', () => {
    assert.equal(isStudioAdmin({ role: 'admin' }), true);
    assert.equal(isStudioAdmin({ role: 'user' }), false);
    assert.equal(isStudioAdmin({}), false);
    assert.equal(isStudioAdmin(null), false);
  });

  it('normalizes studio place tags from arrays or JSON strings', () => {
    assert.deepEqual(normalizeStudioPlaceTags(['calm', 'foodie']), ['calm', 'foodie']);
    assert.deepEqual(normalizeStudioPlaceTags('["calm","foodie"]'), ['calm', 'foodie']);
    assert.deepEqual(normalizeStudioPlaceTags('not-json'), []);
    assert.deepEqual(normalizeStudioPlaceTags(null), []);
  });
});
