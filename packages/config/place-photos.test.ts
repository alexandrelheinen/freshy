import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACE_PHOTO_CATEGORIES,
  defaultPlacePhotoFilename,
  defaultPlacePhotoLocalPath,
  defaultPlacePhotoR2Key,
  resolvePlacePhotoUrl,
} from './place-photos';

describe('@freshy/config place-photos', () => {
  it('defines one default asset per place category', () => {
    assert.equal(PLACE_PHOTO_CATEGORIES.length, 7);
    assert.equal(defaultPlacePhotoFilename('PUBLIC_SPACE'), 'default-public_space.png');
    assert.equal(defaultPlacePhotoR2Key('CAFE'), 'places/defaults/default-cafe.png');
    assert.equal(defaultPlacePhotoLocalPath('MALL'), '/place-defaults/default-mall.png');
  });

  it('keeps custom venue photos when provided', () => {
    assert.equal(
      resolvePlacePhotoUrl('https://cdn.example/venue.jpg', 'CAFE'),
      'https://cdn.example/venue.jpg',
    );
  });

  it('uses R2 public base URL for defaults when configured', () => {
    assert.equal(
      resolvePlacePhotoUrl(null, 'LIBRARY', 'https://assets.freshy.app'),
      'https://assets.freshy.app/places/defaults/default-library.png',
    );
  });

  it('falls back to bundled web paths without R2', () => {
    assert.equal(resolvePlacePhotoUrl(null, 'COWORKING'), '/place-defaults/default-coworking.png');
  });
});
