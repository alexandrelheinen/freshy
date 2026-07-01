import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveThemeId, themePreferenceLabel, isThemePreference } from './theme-storage';

describe('theme-storage', () => {
  it('resolves explicit light and dark preferences', () => {
    assert.equal(resolveThemeId('default', true), 'default');
    assert.equal(resolveThemeId('dark', false), 'dark');
  });

  it('resolves system preference from prefers-color-scheme', () => {
    assert.equal(resolveThemeId('system', true), 'dark');
    assert.equal(resolveThemeId('system', false), 'default');
  });

  it('labels preferences for UI copy', () => {
    assert.equal(themePreferenceLabel('default'), 'Light');
    assert.equal(themePreferenceLabel('dark'), 'Dark');
    assert.equal(themePreferenceLabel('system'), 'System');
  });

  it('validates stored theme preference values', () => {
    assert.equal(isThemePreference('default'), true);
    assert.equal(isThemePreference('dark'), true);
    assert.equal(isThemePreference('system'), true);
    assert.equal(isThemePreference('light'), false);
    assert.equal(isThemePreference(null), false);
  });
});
