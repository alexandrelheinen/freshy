import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import { APP_ICON_PATHS, APP_METADATA_ICONS } from './app-icons';
import { appMetadata } from './app-metadata';

const publicDir = join(import.meta.dirname, '../../public');
const primary = getDefaultThemeTokens().colors.primary;

describe('@freshy/web app icons', () => {
  it('exposes public icon URLs used by the Pages export', () => {
    assert.equal(APP_ICON_PATHS.faviconIco, '/favicon.ico');
    assert.equal(APP_ICON_PATHS.faviconSvg, '/favicon.svg');
    assert.equal(APP_ICON_PATHS.iconPng, '/icon.png');
    assert.equal(APP_ICON_PATHS.appleTouchIcon, '/apple-touch-icon.png');
  });

  it('ships favicon and apple-touch-icon files in public/', () => {
    assert.equal(existsSync(join(publicDir, 'favicon.ico')), true);
    assert.equal(existsSync(join(publicDir, 'favicon.svg')), true);
    assert.equal(existsSync(join(publicDir, 'icon.png')), true);
    assert.equal(existsSync(join(publicDir, 'apple-touch-icon.png')), true);
  });

  it('uses the brand primary color in the SVG favicon', () => {
    const svg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8');
    assert.match(svg, /<svg[\s\S]*<\/svg>/);
    assert.match(svg, new RegExp(primary.replace('#', '#?')));
  });

  it('wires icon link targets in Next.js metadata', () => {
    const iconUrls = APP_METADATA_ICONS.icon.map((icon) => icon.url);
    assert.deepEqual(iconUrls, [
      APP_ICON_PATHS.faviconIco,
      APP_ICON_PATHS.faviconSvg,
      APP_ICON_PATHS.iconPng,
    ]);
    assert.equal(APP_METADATA_ICONS.apple[0]?.url, APP_ICON_PATHS.appleTouchIcon);
    assert.equal(appMetadata.icons, APP_METADATA_ICONS);
  });
});
