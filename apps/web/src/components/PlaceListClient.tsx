'use client';

import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon, PLACE_CATEGORY_LABELS, type PlaceCategory } from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListCard } from './PlaceListCard';
import type { PlaceDto } from '../lib/api';
import { fetchPlaces } from '../lib/api';

export function PlaceListClient({
  title,
  backHref,
  places: initialPlaces,
  loadPlaces,
  showBookmark = false,
  navActive = 'cooling',
  searchPlaceholder = 'Search places…',
  emptyMessage = 'No places found.',
}: {
  title: string;
  backHref: string;
  places?: PlaceDto[];
  loadPlaces?: () => Promise<PlaceDto[]>;
  showBookmark?: boolean;
  navActive?: 'explore' | 'saved' | 'cooling' | 'profile';
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const [places, setPlaces] = useState<PlaceDto[]>(initialPlaces ?? []);
  const [query, setQuery] = useState('');
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
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (PLACE_CATEGORY_LABELS[p.category as PlaceCategory] ?? p.category)
          .toLowerCase()
          .includes(q),
    );
  }, [places, query]);

  return (
    <div className="min-h-screen pb-32 md:pb-8" data-page="place-list">
      <AppMobileHeader title={title} backHref={backHref} showBrand={false} />
      <AppTopNav active={navActive} />

      <main className="mx-auto mt-20 max-w-3xl px-margin-mobile pt-0 md:max-w-5xl md:px-10 md:pt-4">
        <div className="mb-6 hidden md:block">
          <h1 className="font-headline-lg text-primary">{title}</h1>
        </div>

        <section className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-grow">
              <MaterialIcon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 font-body-sm shadow-sm transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container transition-transform active:scale-95"
              aria-label="Filter"
            >
              <MaterialIcon name="tune" />
            </button>
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
                <PlaceListCard place={place} showBookmark={showBookmark} bookmarkFilled={showBookmark} />
              </div>
            ))}
          </section>
        )}
      </main>

      <AppBottomNav active={navActive} />
    </div>
  );
}
