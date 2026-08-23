'use client';

export function ReviewPaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-body-sm text-secondary">
        Page {page} of {totalPages} ({total} reviews)
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
