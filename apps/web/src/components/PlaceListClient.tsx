'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PLACE_TAG_LABELS,
  PLACE_TAGS,
  MaterialIcon,
  PLACE_CATEGORY_LABELS,
  type PlaceCategory,
} from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
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
      list = list.filter((p) => p.aggregatedTemperatureC != null && p.aggregatedTemperatureC <= 22);
    }
    if (activeFilter === 'nearby') {
      list = list.filter((p) => p.distanceKm != null && p.distanceKm <= 1);
    }
    return list;
  }, [places, query, activeFilter]);

  const filterChips: Array<{ id: FilterChip; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'cold', label: 'Under 22°C' },
    { id: 'nearby', label: 'Within 1km' },
  ];

  return (
    <div className="min-h-screen pb-32 md:pb-8" data-page="place-list">
      <AppMobileHeader title={title} backHref={backHref} showBrand={false} />
      <AppTopNav active={navActive} />

      <main className="mx-auto mt-20 max-w-3xl px-margin-mobile pt-0 md:max-w-6xl md:px-10 md:pt-4">
        <section className="mb-6">
          <div className="mb-4 hidden md:block">
            <h1 className="font-headline-lg text-on-surface">{title}</h1>
            {subtitle ? (
              <p className="mt-1 font-body-lg text-on-surface-variant">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex gap-3">
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
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container transition-transform active:scale-95 md:rounded-full"
              aria-label="Filter"
            >
              <MaterialIcon name="tune" />
            </button>
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
            {PLACE_TAGS.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="shrink-0 whitespace-nowrap rounded-full bg-secondary-container px-4 py-2 font-label-caps text-label-caps text-on-secondary-container"
              >
                {tag.label}
              </span>
            ))}
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

      <AppBottomNav active={navActive} />
    </div>
  );
}
