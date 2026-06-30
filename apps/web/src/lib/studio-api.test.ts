import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isStudioAdmin } from './studio-api';

describe('studio-api', () => {
  it('detects studio admin metadata', () => {
    assert.equal(isStudioAdmin({ role: 'admin' }), true);
    assert.equal(isStudioAdmin({ role: 'user' }), false);
    assert.equal(isStudioAdmin({}), false);
    assert.equal(isStudioAdmin(null), false);
  });
});
