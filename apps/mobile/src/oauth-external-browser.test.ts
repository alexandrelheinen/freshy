import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuthSessionReturnUrl,
  buildWebViewNavigateScript,
  isGoogleOAuthUrl,
} from './oauth-external-browser';

describe('isGoogleOAuthUrl', () => {
  it('detects accounts.google.com OAuth URLs', () => {
    assert.equal(
      isGoogleOAuthUrl(
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&redirect_uri=https%3A%2F%2Fclerk.example',
      ),
      true,
    );
  });

  it('detects oauth2.googleapis.com URLs', () => {
    assert.equal(isGoogleOAuthUrl('https://oauth2.googleapis.com/token'), true);
  });

  it('detects legacy google.com sign-in paths', () => {
    assert.equal(isGoogleOAuthUrl('https://www.google.com/signin/oauth/legacy'), true);
  });

  it('ignores the Freshy web app and other origins', () => {
    assert.equal(isGoogleOAuthUrl('https://getfreshy.pages.dev/profile'), false);
    assert.equal(isGoogleOAuthUrl('https://clerk.example.com/v1/oauth'), false);
    assert.equal(isGoogleOAuthUrl('not-a-url'), false);
  });
});

describe('buildAuthSessionReturnUrl', () => {
  it('normalizes the web app URL into a trailing-slash prefix', () => {
    assert.equal(
      buildAuthSessionReturnUrl('https://getfreshy.pages.dev'),
      'https://getfreshy.pages.dev/',
    );
    assert.equal(
      buildAuthSessionReturnUrl('https://getfreshy.pages.dev/'),
      'https://getfreshy.pages.dev/',
    );
  });
});

describe('buildWebViewNavigateScript', () => {
  it('replaces the current WebView location with the OAuth callback URL', () => {
    assert.equal(
      buildWebViewNavigateScript('https://getfreshy.pages.dev/profile?__clerk_status=complete'),
      'window.location.replace("https://getfreshy.pages.dev/profile?__clerk_status=complete"); true;',
    );
  });
});
