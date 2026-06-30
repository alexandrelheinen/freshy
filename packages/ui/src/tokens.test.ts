import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_PLACE_CATEGORIES,
  BRAND_ICON,
  BRAND_NAME,
  BRAND_TITLE,
  DEFAULT_PLACE_PHOTO_PATHS,
  getPlacePhotoUrl,
  NAV_ICONS,
  PILOT_CITY,
  PLACE_CATEGORY_ICONS,
  ROUTES,
  TYPOGRAPHY_SCALE,
} from './tokens';

describe('@freshy/ui tokens', () => {
  it('defines brand name', () => {
    assert.equal(BRAND_NAME, 'Freshy');
    assert.equal(BRAND_TITLE, 'Freshy | Cooling Map');
    assert.equal(PILOT_CITY.name, 'Clichy');
    assert.equal(PILOT_CITY.postalCode, '92110');
  });

  it('defines route helpers', () => {
    assert.equal(ROUTES.explore, '/explore');
    assert.equal(ROUTES.place('demo'), '/places/demo');
    assert.equal(ROUTES.addPlace, '/profile/places/new');
    assert.equal(ROUTES.studio, '/studio');
  });

  it('maps each place category to a default photo path', () => {
    for (const category of ALL_PLACE_CATEGORIES) {
      assert.match(DEFAULT_PLACE_PHOTO_PATHS[category], /^\/place-defaults\/default-[a-z_]+\.png$/);
    }
    assert.equal(getPlacePhotoUrl(null, 'CAFE'), '/place-defaults/default-cafe.png');
    assert.equal(
      getPlacePhotoUrl('https://cdn.example/photo.jpg', 'CAFE'),
      'https://cdn.example/photo.jpg',
    );
  });

  it('uses NEXT_PUBLIC_R2_PUBLIC_URL for defaults when configured', () => {
    const saved = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = 'https://assets.freshy.app';
    assert.equal(
      getPlacePhotoUrl(null, 'MUSEUM'),
      'https://assets.freshy.app/places/defaults/default-museum.png',
    );
    if (saved) process.env.NEXT_PUBLIC_R2_PUBLIC_URL = saved;
    else delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  });

  it('defines navigation and brand icons', () => {
    assert.equal(BRAND_ICON, 'nest_farsight_cool');
    assert.equal(NAV_ICONS.explore, 'explore');
    assert.equal(NAV_ICONS.saved, 'bookmark_heart');
    assert.equal(NAV_ICONS.cooling, 'climate_mini_split');
    assert.equal(NAV_ICONS.profile, 'digital_wellbeing');
  });

  it('lists typography scale keys aligned with DESIGN.md', () => {
    assert.deepEqual(TYPOGRAPHY_SCALE, [
      'display-lg',
      'headline-lg',
      'headline-lg-mobile',
      'title-md',
      'body-lg',
      'body-sm',
      'label-caps',
    ]);
  });
});
