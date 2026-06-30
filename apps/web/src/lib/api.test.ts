import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  freshnessBarState,
  directionsUrl,
  formatDistance,
  formatDistanceWithWalk,
  formatRelativeTime,
  formatWalkTime,
} from './api';

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

  it('maps freshness level to bar segments', () => {
    assert.equal(freshnessBarState('VERY_COLD_AC').segments, 3);
    assert.equal(freshnessBarState('GOOD_VENTILATION').segments, 1);
    assert.equal(freshnessBarState('NATURALLY_FRESH').tone, 'green');
  });

  it('builds directions URL from address when available', () => {
    const url = directionsUrl({
      latitude: 48.9042,
      longitude: 2.3064,
      address: 'Rue Martre, 92110 Clichy',
    });
    assert.match(url, /destination=Rue%20Martre/);
    assert.doesNotMatch(url, /48\.9042/);
  });

  it('builds directions URL from coordinates when address is missing', () => {
    const url = directionsUrl({ latitude: 48.9042, longitude: 2.3064, address: null });
    assert.equal(url, 'https://www.google.com/maps/dir/?api=1&destination=48.9042,2.3064');
  });
});
