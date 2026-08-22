import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACE_PHOTO_CATEGORIES,
  defaultPlacePhotoFilename,
  defaultPlacePhotoLocalPath,
  defaultPlacePhotoR2Key,
  defaultPlacePhotoThumbLocalPath,
  defaultPlacePhotoThumbR2Key,
  resolvePlacePhotoUrl,
  placePhotoSrcAfterError,
} from './place-photos';

describe('@freshy/config place-photos', () => {
  it('defines one default asset per place category', () => {
    assert.equal(PLACE_PHOTO_CATEGORIES.length, 8);
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

  it('resolves thumb variants for mobile category cards', () => {
    assert.equal(defaultPlacePhotoThumbR2Key('CAFE'), 'places/defaults/thumbs/default-cafe.webp');
    assert.equal(
      defaultPlacePhotoThumbLocalPath('MALL'),
      '/place-defaults/thumbs/default-mall.webp',
    );
    assert.equal(
      resolvePlacePhotoUrl(null, 'BAR', 'https://assets.freshy.app', 'thumb'),
      'https://assets.freshy.app/places/defaults/thumbs/default-bar.webp',
    );
    assert.equal(
      resolvePlacePhotoUrl(null, 'MUSEUM', undefined, 'thumb'),
      '/place-defaults/thumbs/default-museum.webp',
    );
  });

  it('falls back to bundled web paths without R2', () => {
    assert.equal(resolvePlacePhotoUrl(null, 'COWORKING'), '/place-defaults/default-coworking.png');
  });

  it('returns the category default after a remote photo fails', () => {
    assert.equal(
      placePhotoSrcAfterError(
        'https://cdn.eat-list.fr/establishment/photo/gallery_photo/92110-clichy/chez-francois_160400_b90.jpg',
        'RESTAURANT',
      ),
      '/place-defaults/default-restaurant.png',
    );
  });

  it('uses the R2 default-thumb pipeline when a remote photo fails', () => {
    assert.equal(
      placePhotoSrcAfterError(
        'https://cdn.eat-list.fr/establishment/photo/gallery_photo/92110-clichy/chez-francois_160400_b90.jpg',
        'RESTAURANT',
        'https://pub-e2a3816cb1244efeb75186f5725a97f7.r2.dev',
      ),
      'https://pub-e2a3816cb1244efeb75186f5725a97f7.r2.dev/places/defaults/default-restaurant.png',
    );
  });

  it('does not loop when the fallback image itself errors', () => {
    assert.equal(placePhotoSrcAfterError('/place-defaults/default-cafe.png', 'CAFE'), null);
    assert.equal(
      placePhotoSrcAfterError(
        'https://assets.freshy.app/places/defaults/default-library.png',
        'LIBRARY',
        'https://assets.freshy.app',
      ),
      null,
    );
  });

  it('returns a thumb default after a failed thumb photo', () => {
    assert.equal(
      placePhotoSrcAfterError('https://cdn.example/broken.jpg', 'BAR', undefined, 'thumb'),
      '/place-defaults/thumbs/default-bar.webp',
    );
  });
});
