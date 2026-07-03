import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildGoogleFontsHref, fontStack, quoteFontFamily } from './fonts';
import { getDefaultThemeTokens } from '../generated/index';

describe('theme fonts', () => {
  it('builds a Google Fonts href from theme font roles', () => {
    const { fonts } = getDefaultThemeTokens();
    const href = buildGoogleFontsHref(fonts);

    assert.match(href, /^https:\/\/fonts\.googleapis\.com\/css2\?/);
    assert.match(href, /family=Quicksand:wght@400;500;600;700/);
    assert.match(href, /family=Cherry\+Bomb\+One:wght@400/);
    assert.match(href, /display=swap$/);
  });

  it('merges weights when sans and logo share a family', () => {
    const href = buildGoogleFontsHref({
      sans: {
        family: 'Quicksand',
        fallbacks: ['system-ui', 'sans-serif'],
        weights: [400, 700],
      },
      logo: {
        family: 'Quicksand',
        fallbacks: ['system-ui', 'sans-serif'],
        weights: [700],
        letterSpacing: '-0.02em',
      },
    });

    assert.equal(
      href,
      'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700&display=swap',
    );
  });

  it('includes distinct families in one href', () => {
    const href = buildGoogleFontsHref({
      sans: {
        family: 'Quicksand',
        fallbacks: ['system-ui', 'sans-serif'],
        weights: [400, 500],
      },
      logo: {
        family: 'Fredoka',
        fallbacks: ['system-ui', 'sans-serif'],
        weights: [700],
      },
    });

    assert.match(href, /family=Quicksand:wght@400;500/);
    assert.match(href, /family=Fredoka:wght@700/);
  });

  it('builds CSS font stacks from YAML definitions', () => {
    const stack = fontStack(getDefaultThemeTokens().fonts.logo);
    assert.deepEqual(stack, ['"Cherry Bomb One"', 'system-ui', 'sans-serif']);
  });

  it('quotes multi-word family names for valid CSS font-family values', () => {
    assert.equal(quoteFontFamily('Cherry Bomb One'), '"Cherry Bomb One"');
    assert.equal(quoteFontFamily('Quicksand'), 'Quicksand');
  });
});
