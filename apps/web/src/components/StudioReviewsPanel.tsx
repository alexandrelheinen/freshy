'use client';

import { useCallback, useEffect, useState } from 'react';
import { MaterialIcon } from '@freshy/ui';
import { formatRelativeTime } from '../lib/api';
import { reviewCoolnessLabel } from '../lib/reviews';
import { deleteStudioReview, fetchStudioReviews, type StudioReviewDto } from '../lib/studio-api';

const STUDIO_REVIEW_PAGE_SIZES = [10, 25, 50] as const;
type StudioReviewPageSize = (typeof STUDIO_REVIEW_PAGE_SIZES)[number];

export function StudioReviewsPanel({
  getToken,
  onToast,
}: {
  getToken: () => Promise<string | null>;
  onToast: (message: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StudioReviewPageSize>(25);
  const [items, setItems] = useState<StudioReviewDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudioReviews(getToken, {
        q: query || undefined,
        page,
        limit: pageSize,
      });
      if (!data) {
        setError('Could not load reviews. Try signing in again.');
        setItems([]);
        setTotal(0);
        return;
      }
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError('Could not load reviews. Try signing in again.');
    } finally {
      setLoading(false);
    }
  }, [getToken, page, pageSize, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  async function handleDelete(review: StudioReviewDto) {
    const confirmed = window.confirm(
      `Delete the review of "${review.place.name}" by ${review.user.displayName}? This cannot be undone.`,
    );
    if (!confirmed) return;
    const ok = await deleteStudioReview(getToken, review.id);
    if (!ok) {
      setError('Could not delete this review. Try again.');
      return;
    }
    onToast('Review deleted.');
    await load();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[16rem] flex-1 items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-3 py-2">
          <MaterialIcon name="search" size={18} className="text-secondary" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setQuery(search.trim());
                setPage(1);
              }
            }}
            placeholder="Search comment, reviewer, or place"
            className="w-full bg-transparent text-body-sm text-on-surface outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setQuery(search.trim());
            setPage(1);
          }}
          className="rounded-xl bg-primary px-4 py-2 font-label-caps text-on-primary"
        >
          Search
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl shadow-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 px-4 py-4 md:px-8 md:py-6">
          <h4 className="font-title-md text-on-surface">Reviews</h4>
          <span className="text-body-sm text-secondary">
            {loading ? 'Loading…' : `Showing ${items.length} of ${total}`}
          </span>
        </div>

        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-4 py-4 font-label-caps uppercase text-secondary md:px-8">Place</th>
              <th className="px-4 py-4 font-label-caps uppercase text-secondary">Reviewer</th>
              <th className="px-4 py-4 font-label-caps uppercase text-secondary">Comment</th>
              <th className="px-4 py-4 font-label-caps uppercase text-secondary">Coolness</th>
              <th className="px-4 py-4 text-right font-label-caps uppercase text-secondary md:px-8">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {items.map((review) => (
              <tr key={review.id} className="transition-colors hover:bg-primary-container/5">
                <td className="px-4 py-5 md:px-8">
                  <p className="font-title-md text-on-surface">{review.place.name}</p>
                  <p className="text-body-sm text-secondary">
                    {formatRelativeTime(review.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-5">
                  <div className="flex items-center gap-3">
                    {review.user.avatarUrl ? (
                      <img
                        src={review.user.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                        {review.user.displayName[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-title-md text-on-surface">{review.user.displayName}</p>
                      <p className="text-body-sm text-secondary">@{review.user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="max-w-sm px-4 py-5 text-body-sm text-on-surface-variant">
                  {review.comment ?? 'No comment.'}
                </td>
                <td className="px-4 py-5 font-label-caps text-secondary">
                  {reviewCoolnessLabel(review.acStrength)}
                </td>
                <td className="px-4 py-5 text-right md:px-8">
                  <button
                    type="button"
                    onClick={() => void handleDelete(review)}
                    className="rounded-lg p-2 text-secondary transition-all hover:bg-error-container/20 hover:text-error"
                    title="Delete review"
                  >
                    <MaterialIcon name="delete" size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-secondary">
                  No reviews match this view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 md:px-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
          >
            Previous
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-body-sm text-secondary">
              <span>Per page</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value) as StudioReviewPageSize);
                  setPage(1);
                }}
                className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1 text-on-surface"
              >
                {STUDIO_REVIEW_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-body-sm text-secondary">
              Page {page} of {totalPages} ({total} reviews)
            </span>
          </div>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
