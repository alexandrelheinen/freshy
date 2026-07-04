import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultThemeTokens } from '../generated/index';

describe('default theme parity', () => {
  it('matches Freshy Arctic primary colors', () => {
    const tokens = getDefaultThemeTokens();
    assert.equal(tokens.colors.primary, '#005f9d');
    assert.equal(tokens.colors['primary-container'], '#0078c5');
    assert.equal(tokens.colors.background, '#f3faff');
    assert.equal(tokens.colors['surface-container-highest'], '#dae4e9');
  });

  it('exports icon slots', () => {
    const tokens = getDefaultThemeTokens();
    assert.equal(tokens.icons.brand, 'nest_farsight_cool');
    assert.equal(tokens.icons.nav.explore, 'explore');
    assert.equal(tokens.icons.category.bar, 'local_bar');
  });

  it('exports spacing and typography scales', () => {
    const tokens = getDefaultThemeTokens();
    assert.equal(tokens.spacing['margin-mobile'], '20px');
    assert.equal(tokens.typography['headline-lg-mobile'].fontSize, '32px');
    assert.equal(tokens.typography['headline-lg'].fontFamily, 'Quicksand');
    assert.equal(tokens.typography['body-lg'].fontWeight, '500');
  });

  it('exports sans and logo font roles', () => {
    const tokens = getDefaultThemeTokens();
    assert.equal(tokens.fonts.sans.family, 'Quicksand');
    assert.equal(tokens.fonts.logo.family, 'Lilita One');
    assert.equal(tokens.fonts.logo.weights[0], 400);
    assert.equal(tokens.fonts.logo.letterSpacing, '0.00em');
  });
});
