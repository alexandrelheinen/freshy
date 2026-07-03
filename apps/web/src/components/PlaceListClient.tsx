'use client';

import { useEffect, useMemo, useState } from 'react';
import { PLACE_CATEGORY_LABELS, type PlaceCategory } from '@freshy/ui';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListCard } from './PlaceListCard';
import type { PlaceDto } from '../lib/api';

type FilterChip = 'all' | 'cold' | 'nearby';

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
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  places?: PlaceDto[];
  loadPlaces?: () => Promise<PlaceDto[]>;
  showBookmark?: boolean;
  onUnsave?: (placeId: string) => Promise<void>;
  navActive?: 'explore' | 'saved' | 'cooling' | 'profile';
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const [places, setPlaces] = useState<PlaceDto[]>(initialPlaces ?? []);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [loading, setLoading] = useState(!initialPlaces);

  useEffect(() => {
    if (!loadPlaces) return;
    void (async () => {
      setLoading(true);
      const data = await loadPlaces();
      setPlaces(data);
      setLoading(false);
    })();
  }, [loadPlaces]);

  useEffect(() => {
    if (activeFilter === 'nearby' && !places.some((place) => place.distanceKm != null)) {
      setActiveFilter('all');
    }
  }, [activeFilter, places]);

  const filtered = useMemo(() => {
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
    if (activeFilter === 'nearby') {
      list = list.filter((p) => p.distanceKm != null && p.distanceKm <= 1);
    }
    return list;
  }, [places, query, activeFilter]);

  const filterChips: Array<{ id: FilterChip; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'cold', label: 'Coldest' },
    ...(places.some((place) => place.distanceKm != null)
      ? [{ id: 'nearby' as const, label: 'Within 1km' }]
      : []),
  ];

  return (
    <div className="min-h-screen pb-8" data-page="place-list">
      <AppMobileHeader title={title} backHref={backHref} showBrand={false} active={navActive} />
      <AppTopNav active={navActive} />

      <main className="mx-auto mt-20 max-w-3xl px-margin-mobile pt-0 md:max-w-6xl md:px-10 md:pt-4">
        <section className="mb-6">
          <div className="mb-4 hidden md:block">
            <h1 className="font-headline-lg text-on-surface">{title}</h1>
            {subtitle ? (
              <p className="mt-1 font-body-lg text-on-surface-variant">{subtitle}</p>
            ) : null}
          </div>

          <div className="relative flex-grow">
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
        </section>

        {loading ? (
          <p className="py-16 text-center text-on-surface-variant">Loading places…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-on-surface-variant">{emptyMessage}</p>
        ) : (
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
        )}
      </main>
    </div>
  );
}
