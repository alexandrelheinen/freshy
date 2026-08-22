import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_NAME, ROUTES } from '@freshy/ui';
import { placeNotFoundCopy } from './place-not-found';

describe('placeNotFoundCopy', () => {
  it('keeps a branded document title for unknown slugs', () => {
    const copy = placeNotFoundCopy();
    assert.equal(copy.documentTitle, `${BRAND_NAME} | Place not found`);
    assert.doesNotMatch(copy.documentTitle, /\u2014/);
  });

  it('points the empty state back to Explore', () => {
    const copy = placeNotFoundCopy();
    assert.equal(copy.backHref, ROUTES.explore);
    assert.equal(copy.backLabel, 'Back to Explore');
  });

  it('keeps the place-detail page marker so screenshots and chrome stay on this screen', () => {
    const copy = placeNotFoundCopy();
    assert.equal(copy.pageMarker, 'place-detail');
    assert.equal(copy.showAppChrome, true);
  });

  it('uses the existing not-found message by default', () => {
    assert.equal(placeNotFoundCopy().message, 'Place not found.');
    assert.equal(placeNotFoundCopy().heading, 'Place not found');
  });

  it('passes through a load error message', () => {
    const copy = placeNotFoundCopy(
      'Could not load this place. Check your connection and try again.',
    );
    assert.match(copy.message, /Could not load this place/);
    assert.equal(copy.backHref, ROUTES.explore);
  });
});
