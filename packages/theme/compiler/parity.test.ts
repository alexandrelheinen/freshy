import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultThemeTokens } from '../generated/index';

describe('default theme parity', () => {
  it('matches legacy primary colors', () => {
    const tokens = getDefaultThemeTokens();
    assert.equal(tokens.colors.primary, '#0c6780');
    assert.equal(tokens.colors['primary-container'], '#87ceeb');
    assert.equal(tokens.colors.background, '#f7f9fb');
    assert.equal(tokens.colors['surface-container-highest'], '#e0e3e5');
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
    assert.equal(tokens.typography['headline-lg-mobile'].fontSize, '24px');
  });
});
