import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { categoryPlacesEmptyMessage } from './category-places-messages';

describe('categoryPlacesEmptyMessage', () => {
  it('keeps the database copy when verified-only is off', () => {
    assert.equal(
      categoryPlacesEmptyMessage('Libraries', false),
      'No libraries in the database yet.',
    );
    assert.equal(
      categoryPlacesEmptyMessage('Malls & Shops', false),
      'No malls & shops in the database yet.',
    );
    assert.equal(
      categoryPlacesEmptyMessage('Coworking', false),
      'No coworking in the database yet.',
    );
    assert.equal(
      categoryPlacesEmptyMessage('Public Spaces', false),
      'No public spaces in the database yet.',
    );
  });

  it('names the verified-only filter instead of claiming the category is missing', () => {
    assert.equal(categoryPlacesEmptyMessage('Libraries', true), 'No verified libraries yet.');
    assert.equal(
      categoryPlacesEmptyMessage('Malls & Shops', true),
      'No verified malls & shops yet.',
    );
    assert.equal(categoryPlacesEmptyMessage('Coworking', true), 'No verified coworking yet.');
    assert.equal(
      categoryPlacesEmptyMessage('Public Spaces', true),
      'No verified public spaces yet.',
    );
  });

  it('never says the category is missing from the database when verified-only is on', () => {
    const message = categoryPlacesEmptyMessage('Libraries', true);
    assert.match(message, /verified/i);
    assert.doesNotMatch(message, /database/i);
  });
});
