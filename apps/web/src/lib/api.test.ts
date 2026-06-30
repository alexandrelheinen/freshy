import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acStrengthLevel, formatDistance, formatDistanceWithWalk, formatWalkTime } from './api';

describe('@freshy/web api helpers', () => {
  it('formats sub-kilometer distances in meters', () => {
    assert.equal(formatDistance(0.25), '250m');
  });

  it('formats walk time from distance', () => {
    assert.equal(formatWalkTime(0.25), '3 mins walk');
    assert.equal(formatDistanceWithWalk(0.25), '250m • 3 mins walk');
  });

  it('formats relative review timestamps', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    assert.equal(formatRelativeTime(yesterday), 'Yesterday');
  });

  it('maps AC strength to bar level', () => {
    assert.equal(acStrengthLevel('FRIGID'), 3);
    assert.equal(acStrengthLevel('LIGHTLY_COOLED'), 1);
  });
});
