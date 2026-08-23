import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACE_LIST_COLUMN_COUNT,
  PLACE_LIST_GRID_CLASS,
  PLACE_LIST_PAGE_SIZE,
  PLACE_LIST_ROW_COUNT,
  paginatePlaceList,
} from './place-list-layout';

describe('place list layout', () => {
  it('fits five rows of three compact cards on each page', () => {
    assert.equal(PLACE_LIST_COLUMN_COUNT, 3);
    assert.equal(PLACE_LIST_ROW_COUNT, 5);
    assert.equal(PLACE_LIST_PAGE_SIZE, 15);
    assert.match(PLACE_LIST_GRID_CLASS, /grid-cols-3/);
  });

  it('paginates saved and category lists with a safe current page', () => {
    const items = Array.from({ length: 16 }, (_, index) => index + 1);
    const first = paginatePlaceList(items, 1);
    assert.deepEqual(first.items, items.slice(0, 15));
    assert.equal(first.totalPages, 2);
    assert.equal(first.total, 16);

    const second = paginatePlaceList(items, 2);
    assert.deepEqual(second.items, [16]);
    assert.equal(second.page, 2);

    const overflow = paginatePlaceList(items, 99);
    assert.equal(overflow.page, 2);
    assert.deepEqual(overflow.items, [16]);
  });
});
