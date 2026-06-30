import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { truncatePlaceName } from './truncate-place-name';

describe('truncatePlaceName', () => {
  it('returns the name unchanged when within the limit', () => {
    assert.equal(truncatePlaceName('Cafe du Parc'), 'Cafe du Parc');
  });

  it('truncates long names with an ellipsis', () => {
    assert.equal(
      truncatePlaceName('Bibliotheque Municipale de Clichy'),
      'Bibliotheque Municipale…',
    );
  });

  it('respects a custom max length', () => {
    assert.equal(truncatePlaceName('Short name here', 10), 'Short nam…');
  });
});
