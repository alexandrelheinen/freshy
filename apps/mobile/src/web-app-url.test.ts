import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WEB_APP_URL, readWebAppUrl, resolveWebAppUrl } from './web-app-url';
import Constants from './test-fixtures/expo-constants';

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('resolveWebAppUrl', () => {
  it('falls back to the production Pages URL when extra config is missing', () => {
    assert.equal(resolveWebAppUrl(undefined), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl(null), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl(''), DEFAULT_WEB_APP_URL);
  });

  it('rejects placeholder strings that become WebView host "undefined"', () => {
    assert.equal(resolveWebAppUrl('undefined'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('UNDEFINED'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('null'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('https://undefined'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('https://undefined/explore'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('http://null'), DEFAULT_WEB_APP_URL);
  });

  it('rejects non-http(s) and unparseable values', () => {
    assert.equal(resolveWebAppUrl('not a url'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('ftp://getfreshy.pages.dev'), DEFAULT_WEB_APP_URL);
    assert.equal(resolveWebAppUrl('/explore'), DEFAULT_WEB_APP_URL);
  });

  it('uses the first usable candidate and skips invalid earlier values', () => {
    assert.equal(
      resolveWebAppUrl('undefined', 'https://preview.example.test/'),
      'https://preview.example.test',
    );
  });

  it('trims trailing slashes from configured URLs', () => {
    assert.equal(resolveWebAppUrl('https://example.test/freshy/'), 'https://example.test/freshy');
  });
});

describe('readWebAppUrl', () => {
  const originalEnv = process.env.EXPO_PUBLIC_WEB_APP_URL;

  afterEach(() => {
    Constants.expoConfig = undefined;
    Constants.manifest = undefined;
    Constants.manifest2 = undefined;
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_WEB_APP_URL;
    } else {
      process.env.EXPO_PUBLIC_WEB_APP_URL = originalEnv;
    }
  });

  it('falls back to the production URL when Expo extra is the string undefined', () => {
    delete process.env.EXPO_PUBLIC_WEB_APP_URL;
    Constants.expoConfig = { extra: { webAppUrl: 'undefined' } };
    assert.equal(readWebAppUrl(), DEFAULT_WEB_APP_URL);
  });

  it('reads a valid extra URL from expoConfig', () => {
    Constants.expoConfig = { extra: { webAppUrl: 'https://preview.example.test/' } };
    assert.equal(readWebAppUrl(), 'https://preview.example.test');
  });

  it('uses EXPO_PUBLIC_WEB_APP_URL when extra config is unusable', () => {
    Constants.expoConfig = { extra: { webAppUrl: 'undefined' } };
    process.env.EXPO_PUBLIC_WEB_APP_URL = 'https://env.example.test';
    assert.equal(readWebAppUrl(), 'https://env.example.test');
  });
});

describe('release WebView URL alignment', () => {
  it('keeps EAS and CI release env pointed at the default production host', () => {
    const eas = JSON.parse(readFileSync(join(mobileRoot, 'eas.json'), 'utf8')) as {
      build: {
        release: { env: { EXPO_PUBLIC_WEB_APP_URL: string } };
        production: { env: { EXPO_PUBLIC_WEB_APP_URL: string } };
      };
    };
    const releaseYml = readFileSync(
      join(mobileRoot, '../../.github/workflows/release.yml'),
      'utf8',
    );

    assert.equal(DEFAULT_WEB_APP_URL, 'https://getfreshy.pages.dev');
    assert.equal(eas.build.release.env.EXPO_PUBLIC_WEB_APP_URL, DEFAULT_WEB_APP_URL);
    assert.equal(eas.build.production.env.EXPO_PUBLIC_WEB_APP_URL, DEFAULT_WEB_APP_URL);
    assert.match(
      releaseYml,
      new RegExp(`EXPO_PUBLIC_WEB_APP_URL:\\s+${DEFAULT_WEB_APP_URL.replaceAll('.', '\\.')}`),
    );
    assert.doesNotMatch(releaseYml, /freshy-25e\.pages\.dev/);
  });
});
