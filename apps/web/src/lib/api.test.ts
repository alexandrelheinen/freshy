import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acStrengthLevel, formatDistance } from './api';

describe('@freshy/web api helpers', () => {
  it('formats sub-kilometer distances in meters', () => {
    assert.equal(formatDistance(0.25), '250m');
  });

  it('maps AC strength to bar level', () => {
    assert.equal(acStrengthLevel('FRIGID'), 3);
    assert.equal(acStrengthLevel('LIGHTLY_COOLED'), 1);
  });
});
