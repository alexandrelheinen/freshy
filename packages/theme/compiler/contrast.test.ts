import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertContrastPairs, contrastRatio } from './contrast';
import { loadTheme } from './compile-themes';

describe('theme contrast', () => {
  it('computes contrast ratio for on-primary on primary', () => {
    const ratio = contrastRatio('#ffffff', '#005f9d');
    assert.ok(ratio !== null && ratio >= 4.5);
  });

  it('default theme on-color pairs meet WCAG AA', () => {
    const theme = loadTheme('default');
    const failures = assertContrastPairs(theme.colors);
    assert.deepEqual(failures, []);
  });

  it('dark theme on-color pairs meet WCAG AA', () => {
    const theme = loadTheme('dark');
    const failures = assertContrastPairs(theme.colors);
    assert.deepEqual(failures, []);
  });
});
