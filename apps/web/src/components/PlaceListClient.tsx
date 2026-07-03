'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MaterialIcon, PLACE_CATEGORY_LABELS, type PlaceCategory } from '@freshy/ui';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListCard } from './PlaceListCard';
import type { PlaceDto } from '../lib/api';
import { distanceKmFromUser } from '../lib/place-distance';
import { useUserLocation } from '../lib/use-user-location';

type FilterChip = 'all' | 'cold' | 'nearby';

export interface PlaceListPagination {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PlaceListClient({
  title,
  subtitle,
  backHref,
  places: initialPlaces,
  loadPlaces,
  showBookmark = false,
  onUnsave,
  navActive = 'cooling',
  searchPlaceholder = 'Search places…',
  emptyMessage = 'No places found.',
  listNotice,
  pagination,
  loading: loadingOverride,
  loadError,
  statusBanner,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  places?: PlaceDto[];
  loadPlaces?: () => Promise<PlaceDto[]>;
  showBookmark?: boolean;
  onUnsave?: (placeId: string) => Promise<void>;
  navActive?: 'explore' | 'cooling' | 'profile';
  searchPlaceholder?: string;
  emptyMessage?: string;
  listNotice?: string | null;
  pagination?: PlaceListPagination;
  loading?: boolean;
  loadError?: string | null;
  statusBanner?: ReactNode;
}) {
  const [places, setPlaces] = useState<PlaceDto[]>(initialPlaces ?? []);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [internalLoading, setInternalLoading] = useState(!initialPlaces && Boolean(loadPlaces));
  const { location } = useUserLocation();
  const loading = loadingOverride ?? internalLoading;

  useEffect(() => {
    if (initialPlaces != null) {
      setPlaces(initialPlaces);
    }
  }, [initialPlaces]);

  useEffect(() => {
    if (!loadPlaces) return;
    void (async () => {
      setInternalLoading(true);
      const data = await loadPlaces();
      setPlaces(data);
      setInternalLoading(false);
    })();
  }, [loadPlaces]);

  useEffect(() => {
    if (activeFilter === 'nearby' && !location) {
      setActiveFilter('all');
    }
  }, [activeFilter, location]);

  const filtered = useMemo(() => {
    if (pagination) {
      return places;
    }

    let list = places;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          (PLACE_CATEGORY_LABELS[p.category as PlaceCategory] ?? p.category)
            .toLowerCase()
            .includes(q),
      );
    }
    if (activeFilter === 'cold') {
      list = list.filter(
        (p) =>
          p.aggregatedFreshnessLevel === 'VERY_COLD_AC' ||
          p.aggregatedFreshnessLevel === 'NATURALLY_FRESH',
      );
    }
    if (activeFilter === 'nearby' && location) {
      list = list.filter((p) => {
        const km = distanceKmFromUser(p, location);
        return km != null && km <= 1;
      });
    }
    return list;
  }, [places, query, activeFilter, location, pagination]);

  const filterChips: Array<{ id: FilterChip; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'cold', label: 'Coldest' },
    ...(location ? [{ id: 'nearby' as const, label: 'Within 1km' }] : []),
  ];

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

          {!pagination ? (
            <>
              <div className="relative">
                <MaterialIcon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                />
                <input
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 font-body-sm shadow-sm transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-primary md:rounded-full"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
                {filterChips.map((chip) => {
                  const isActive = activeFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setActiveFilter(chip.id)}
                      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-label-caps text-label-caps transition-colors ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
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
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-on-surface-variant">{emptyMessage}</p>
        ) : (
          <>
            <section className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-2">
              {filtered.map((place, index) => (
                <div
                  key={place.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
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

            {pagination ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                  className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-body-sm text-secondary">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} places)
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
