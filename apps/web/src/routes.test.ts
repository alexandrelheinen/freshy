import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES } from '@freshy/ui';

describe('@freshy/web routes', () => {
  it('uses shared route constants', () => {
    assert.equal(ROUTES.cooling, '/cooling');
    assert.equal(ROUTES.profile, '/profile');
  });
});
