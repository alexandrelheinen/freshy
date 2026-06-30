import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { locationStatusMessage } from './location-messages';

describe('locationStatusMessage', () => {
  it('explains blocked browser permission', () => {
    const message = locationStatusMessage({
      permissionDenied: true,
      locationError: null,
      searchRadiusKm: 3,
      usingGps: false,
    });
    assert.match(message ?? '', /blocked in your browser/i);
  });

  it('suggests GPS when using map fallback', () => {
    const message = locationStatusMessage({
      permissionDenied: false,
      locationError: null,
      searchRadiusKm: 3,
      usingGps: false,
    });
    assert.match(message ?? '', /last map area/i);
    assert.match(message ?? '', /Use my location/i);
  });

  it('returns null when GPS is active', () => {
    assert.equal(
      locationStatusMessage({
        permissionDenied: false,
        locationError: null,
        searchRadiusKm: 3,
        usingGps: true,
      }),
      null,
    );
  });
});
