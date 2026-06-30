import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlacePhotoForApi } from './place-photo-url';

describe('@freshy/api place-photo-url', () => {
  it('resolves default photo URLs from category when photoUrl is missing', () => {
    const saved = process.env.R2_PUBLIC_URL;
    delete process.env.R2_PUBLIC_URL;

    assert.equal(resolvePlacePhotoForApi(null, 'CAFE'), '/place-defaults/default-cafe.png');

    if (saved) process.env.R2_PUBLIC_URL = saved;
  });

  it('uses R2 public URL for defaults when configured', () => {
    const saved = process.env.R2_PUBLIC_URL;
    process.env.R2_PUBLIC_URL = 'https://assets.freshy.app';

    assert.equal(
      resolvePlacePhotoForApi(null, 'MALL'),
      'https://assets.freshy.app/places/defaults/default-mall.png',
    );

    if (saved) process.env.R2_PUBLIC_URL = saved;
    else delete process.env.R2_PUBLIC_URL;
  });

  it('keeps custom venue photos unchanged', () => {
    assert.equal(
      resolvePlacePhotoForApi('https://assets.freshy.app/places/ice-coffee-central.png', 'CAFE'),
      'https://assets.freshy.app/places/ice-coffee-central.png',
    );
  });
});
