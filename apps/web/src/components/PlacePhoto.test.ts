import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placePhotoSrcAfterError } from '@freshy/ui';

describe('PlacePhoto fallback', () => {
  it('replaces a 403ing remote venue photo with the category default', () => {
    const failed =
      'https://cdn.eat-list.fr/establishment/photo/gallery_photo/92110-clichy/chez-francois_160400_b90.jpg';
    assert.equal(
      placePhotoSrcAfterError(failed, 'RESTAURANT'),
      '/place-defaults/default-restaurant.png',
    );
  });

  it('stops after one fallback so a missing default does not loop', () => {
    assert.equal(
      placePhotoSrcAfterError('/place-defaults/default-restaurant.png', 'RESTAURANT'),
      null,
    );
  });
});
