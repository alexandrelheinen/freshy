'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListCard } from './PlaceListCard';
import type { PlaceDto } from '../lib/api';
import { PLACE_LIST_GRID_CLASS } from '../lib/place-list-layout';

export interface PlaceListPagination {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PlaceListPaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: PlaceListPagination) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-body-sm text-secondary">
        Page {page} of {totalPages} ({total} places)
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

export function PlaceListClient({
  title,
  subtitle,
  backHref,
  places: initialPlaces,
  showBookmark = false,
  onUnsave,
  navActive = 'cooling',
  emptyMessage = 'No places found.',
  listNotice,
  pagination,
  toolbar,
  loading: loadingOverride,
  loadError,
  statusBanner,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  places?: PlaceDto[];
  showBookmark?: boolean;
  onUnsave?: (placeId: string) => Promise<void>;
  navActive?: 'explore' | 'cooling' | 'profile';
  emptyMessage?: string;
  listNotice?: string | null;
  pagination?: PlaceListPagination;
  toolbar?: ReactNode;
  loading?: boolean;
  loadError?: string | null;
  statusBanner?: ReactNode;
}) {
  const [places, setPlaces] = useState<PlaceDto[]>(initialPlaces ?? []);
  const loading = loadingOverride ?? false;

  useEffect(() => {
    if (initialPlaces != null) {
      setPlaces(initialPlaces);
    }
  }, [initialPlaces]);

  return (
    <div className="min-h-screen pb-8" data-page="place-list">
      {backHref ? (
        <AppMobileHeader title={title} backHref={backHref} showBrand={false} active={navActive} />
      ) : (
        <AppMobileHeader active={navActive} />
      )}
      <AppTopNav active={navActive} />

      <main className="mx-auto mt-20 max-w-3xl px-margin-mobile pt-0 md:max-w-6xl md:px-10 md:pt-4">
        {statusBanner ? (
          <section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-4 text-center">
            {statusBanner}
          </section>
        ) : null}
        <section className="mb-6">
          <div className={`mb-4 ${backHref ? 'hidden md:block' : 'block'}`}>
            <h1
              className={
                backHref
                  ? 'font-headline-lg text-on-surface'
                  : 'font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg'
              }
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 font-body-lg text-on-surface-variant">{subtitle}</p>
            ) : null}
          </div>
          {toolbar ? <div className="mb-4">{toolbar}</div> : null}
        </section>

        {listNotice ? (
          <p className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-center text-sm text-on-surface-variant">
            {listNotice}
          </p>
        ) : null}

        {loadError ? (
          <p className="py-16 text-center text-error">{loadError}</p>
        ) : loading ? (
          <p className="py-16 text-center text-on-surface-variant">Loading places…</p>
        ) : places.length === 0 ? (
          <p className="py-16 text-center text-on-surface-variant">{emptyMessage}</p>
        ) : (
          <>
            <section className={PLACE_LIST_GRID_CLASS}>
              {places.map((place, index) => (
                <div
                  key={place.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                >
                  <PlaceListCard
                    place={place}
                    showBookmark={showBookmark}
                    bookmarkFilled={showBookmark}
                    onBookmarkClick={
                      onUnsave
                        ? () => {
                            void onUnsave(place.id);
                          }
                        : undefined
                    }
                  />
                </div>
              ))}
            </section>

            {pagination ? <PlaceListPaginationBar {...pagination} /> : null}
          </>
        )}
      </main>
    </div>
  );
}
