import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import { themeColors } from './theme';

describe('mobile theme colors', () => {
  it('matches web default primary and surface tokens', () => {
    const web = getDefaultThemeTokens().colors;
    assert.equal(themeColors.primary, web.primary);
    assert.equal(themeColors.surface, web.surface);
    assert.equal(themeColors.background, web.background);
  });
});
