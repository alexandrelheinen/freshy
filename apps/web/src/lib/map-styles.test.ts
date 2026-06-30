import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapStyleUrl, MAP_STYLES } from './map-styles';

describe('map-styles', () => {
  it('maps style ids to Mapbox style URLs', () => {
    assert.equal(mapStyleUrl('streets'), MAP_STYLES.streets);
    assert.equal(mapStyleUrl('satellite'), MAP_STYLES.satellite);
    assert.match(mapStyleUrl('satellite'), /satellite-streets/);
  });
});
