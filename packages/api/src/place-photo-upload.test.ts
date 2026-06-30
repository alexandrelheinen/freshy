import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePlacePhoto } from './place-photo-upload';

describe('place-photo-upload', () => {
  it('accepts allowed image types within size limit', () => {
    const buffer = Buffer.alloc(1024);
    assert.deepEqual(validatePlacePhoto(buffer, 'image/jpeg'), { ok: true });
  });

  it('rejects unsupported mime types', () => {
    const buffer = Buffer.alloc(16);
    const result = validatePlacePhoto(buffer, 'image/gif');
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /PNG, JPG, or WebP/);
  });

  it('rejects files larger than 10MB', () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    const result = validatePlacePhoto(buffer, 'image/png');
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /10MB/);
  });
});
