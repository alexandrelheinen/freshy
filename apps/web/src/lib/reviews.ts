export const REVIEW_PAGE_SIZE = 5;

export interface ReviewPageDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function buildReviewsSearchParams(params: {
  page?: number;
  limit?: number;
  q?: string;
  placeId?: string;
}): URLSearchParams {
  const search = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.limit ?? REVIEW_PAGE_SIZE;
  search.set('page', String(page));
  search.set('limit', String(limit));
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.placeId?.trim()) search.set('placeId', params.placeId.trim());
  return search;
}

export function reviewPageCount(total: number, limit: number = REVIEW_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / limit) || 1);
}

export function reviewCoolnessLabel(acStrength: number): string {
  if (acStrength >= 4) return 'Frigid';
  if (acStrength >= 3) return 'Comfortable';
  return 'Cooled';
}

export function reviewCoolnessSegments(acStrength: number): number {
  return Math.min(3, Math.max(1, acStrength >= 4 ? 3 : acStrength >= 3 ? 2 : 1));
}
