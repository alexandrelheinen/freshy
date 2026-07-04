import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_PLACE_CATEGORIES,
  BRAND_ICON,
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_TITLE,
  LOGO_FONT,
  DEFAULT_PLACE_PHOTO_PATHS,
  EXPLORE_FILTER_CHIPS,
  getPlacePhotoUrl,
  NAV_ICONS,
  PILOT_CITY,
  PLACE_CATEGORY_CHIP_LABELS,
  PLACE_CATEGORY_ICONS,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  TYPOGRAPHY_SCALE,
} from './tokens';

describe('@freshy/ui tokens', () => {
  it('defines brand name', () => {
    assert.equal(BRAND_NAME, 'Freshy');
    assert.equal(BRAND_TAGLINE, 'Find fresh places near you, from natural shade to cold AC.');
    assert.equal(BRAND_TITLE, 'Freshy | Fresh Places Map');
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

  it('resolves thumb variants for mobile cooling cards', () => {
    assert.equal(
      getPlacePhotoUrl(null, 'CAFE', 'thumb'),
      '/place-defaults/thumbs/default-cafe.webp',
    );
    const saved = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = 'https://assets.freshy.app';
    assert.equal(
      getPlacePhotoUrl(null, 'LIBRARY', 'thumb'),
      'https://assets.freshy.app/places/defaults/thumbs/default-library.webp',
    );
    if (saved) process.env.NEXT_PUBLIC_R2_PUBLIC_URL = saved;
    else delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  });

  it('defines navigation and brand icons', () => {
    assert.equal(BRAND_ICON, 'nest_farsight_cool');
    assert.equal(LOGO_FONT, 'Lilita One');
    assert.equal(NAV_ICONS.explore, 'explore');
    assert.equal(NAV_ICONS.saved, 'bookmark_heart');
    assert.equal(NAV_ICONS.cooling, 'category_search');
    assert.equal(NAV_ICONS.profile, 'digital_wellbeing');
    assert.equal(PLACE_CATEGORY_ICONS.PUBLIC_SPACE, 'nature');
    assert.equal(PLACE_CATEGORY_ICONS.MUSEUM, 'theater_comedy');
  });

  it('labels MUSEUM as Arts & Culture in the UI while the API keyword stays MUSEUM', () => {
    assert.equal(PLACE_CATEGORY_LABELS.MUSEUM, 'Arts & Culture');
    assert.equal(PLACE_CATEGORY_CHIP_LABELS.MUSEUM, 'Arts & Culture');
    assert.equal(EXPLORE_FILTER_CHIPS.length, ALL_PLACE_CATEGORIES.length);
    for (const category of ALL_PLACE_CATEGORIES) {
      assert.equal(PLACE_CATEGORY_CHIP_LABELS[category].length > 0, true);
      assert.ok(EXPLORE_FILTER_CHIPS.some((chip) => chip.category === category));
    }
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
