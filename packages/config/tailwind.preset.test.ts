import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { freshyColors, freshySpacing, freshyTypography } from './tailwind.preset';

describe('@freshy/config tailwind preset', () => {
  it('exports design system colors from DESIGN.md', () => {
    assert.equal(freshyColors.primary, '#0c6780');
    assert.equal(freshyColors['primary-container'], '#87ceeb');
    assert.equal(freshyColors.background, '#f7f9fb');
  });

  it('exports spacing scale from DESIGN.md', () => {
    assert.equal(freshySpacing.base, '4px');
    assert.equal(freshySpacing.lg, '24px');
    assert.equal(freshySpacing['margin-mobile'], '20px');
  });

  it('exports typography scale from DESIGN.md', () => {
    assert.equal(freshyTypography['display-lg'].fontSize, '36px');
    assert.equal(freshyTypography['display-lg'].lineHeight, '44px');
    assert.equal(freshyTypography['headline-lg'].fontSize, '28px');
    assert.equal(freshyTypography['headline-lg-mobile'].fontSize, '24px');
    assert.equal(freshyTypography['title-md'].fontSize, '18px');
    assert.equal(freshyTypography['body-lg'].fontSize, '16px');
    assert.equal(freshyTypography['body-sm'].fontSize, '14px');
    assert.equal(freshyTypography['label-caps'].fontSize, '12px');
    assert.equal(freshyTypography['label-caps'].letterSpacing, '0.05em');
  });
});
