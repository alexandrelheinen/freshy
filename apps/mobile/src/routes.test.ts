import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES } from '@freshy/ui';

describe('@freshy/mobile routes', () => {
  it('shares route helpers with web', () => {
    assert.equal(ROUTES.explore, '/explore');
  });
});
