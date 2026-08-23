/** Compact category and saved-place grids: 3 columns, 5 rows. */
export const PLACE_LIST_COLUMN_COUNT = 3;
export const PLACE_LIST_ROW_COUNT = 5;
export const PLACE_LIST_PAGE_SIZE = PLACE_LIST_COLUMN_COUNT * PLACE_LIST_ROW_COUNT;

export const PLACE_LIST_GRID_CLASS = 'grid grid-cols-3 gap-2 md:gap-3';

export function paginatePlaceList<T>(
  items: readonly T[],
  page: number,
  pageSize: number = PLACE_LIST_PAGE_SIZE,
): {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    pageSize,
  };
}
