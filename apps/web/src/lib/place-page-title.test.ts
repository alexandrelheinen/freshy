import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_NAME, BRAND_TITLE } from '@freshy/ui';
import { placePageTitle } from './place-page-title';

describe('placePageTitle', () => {
  it('formats a loaded place document title as Place name | Freshy', () => {
    assert.equal(placePageTitle('Le 34 Paris'), `Le 34 Paris | ${BRAND_NAME}`);
    assert.equal(placePageTitle('Le 34 Paris'), 'Le 34 Paris | Freshy');
  });

  it('does not keep the generic map title after a place loads', () => {
    assert.notEqual(placePageTitle('Le 34 Paris'), BRAND_TITLE);
  });

  it('uses a pipe separator and no em dash', () => {
    const title = placePageTitle('Cafe du Parc');
    assert.match(title, / \| /);
    assert.doesNotMatch(title, /\u2014/);
  });
});
