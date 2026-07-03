import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import { freshyColors, freshyShadows, freshySpacing, freshyTypography } from './tailwind.preset';
import { FRESHY_Z_INDEX } from './layering';

describe('@freshy/config tailwind preset', () => {
  it('maps colors to CSS variables', () => {
    assert.equal(freshyColors.primary, 'var(--color-primary)');
    assert.equal(freshyColors['primary-container'], 'var(--color-primary-container)');
    assert.equal(freshyColors.background, 'var(--color-background)');
    assert.ok(!Object.values(freshyColors).some((value) => value.includes('#')));
  });

  it('maps shadows to CSS variables', () => {
    assert.equal(freshyShadows.card, 'var(--shadow-card)');
    assert.equal(freshyShadows.nav, 'var(--shadow-nav)');
  });

  it('reads spacing and typography from default theme tokens', () => {
    const tokens = getDefaultThemeTokens();
    assert.equal(freshySpacing.base, tokens.spacing.base);
    assert.equal(freshySpacing.lg, tokens.spacing.lg);
    assert.equal(freshySpacing['margin-mobile'], tokens.spacing['margin-mobile']);
    assert.equal(freshyTypography['display-lg'].fontSize, tokens.typography['display-lg'].fontSize);
    assert.equal(
      freshyTypography['headline-lg'].fontSize,
      tokens.typography['headline-lg'].fontSize,
    );
    assert.equal(
      freshyTypography['headline-lg-mobile'].fontSize,
      tokens.typography['headline-lg-mobile'].fontSize,
    );
    assert.equal(freshyTypography['title-md'].fontSize, tokens.typography['title-md'].fontSize);
    assert.equal(freshyTypography['body-lg'].fontSize, tokens.typography['body-lg'].fontSize);
    assert.equal(freshyTypography['body-sm'].fontSize, tokens.typography['body-sm'].fontSize);
    assert.equal(freshyTypography['label-caps'].fontSize, tokens.typography['label-caps'].fontSize);
    assert.equal(
      freshyTypography['label-caps'].letterSpacing,
      tokens.typography['label-caps'].letterSpacing,
    );
  });
});
