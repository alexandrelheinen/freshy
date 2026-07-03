import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app';

describe('route registration', () => {
  const app = createApp();

  it('registers GET /users/me/contributor-secret', async () => {
    const res = await app.request('/users/me/contributor-secret');
    assert.notEqual(res.status, 404);
  });

  it('registers POST /contributions/places', async () => {
    const res = await app.request('/contributions/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.notEqual(res.status, 404);
  });

  it('registers GET /places/drafts', async () => {
    const res = await app.request('/places/drafts');
    assert.notEqual(res.status, 404);
  });

  it('registers GET /studio/users/lookup', async () => {
    const res = await app.request('/studio/users/lookup');
    assert.notEqual(res.status, 404);
  });

  it('registers GET /places/category-list', async () => {
    const res = await app.request('/places/category-list');
    assert.notEqual(res.status, 404);
  });

  it('registers POST /users/me/places', async () => {
    const res = await app.request('/users/me/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.notEqual(res.status, 404);
  });
});
