'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FRESHNESS_LEVEL_LABELS,
  DEFAULT_PLACE_PHOTO_PATHS,
  GlassCard,
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  getPlacePhotoUrl,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import type { CategoryMeta } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Desktop bento grid layout: category key and optional column span. */
const DESKTOP_BENTO: Array<{ category: PlaceCategory; colSpan?: 1 | 2 }> = [
  { category: 'CAFE', colSpan: 2 },
  { category: 'LIBRARY' },
  { category: 'RESTAURANT' },
  { category: 'BAR' },
  { category: 'MUSEUM' },
  { category: 'COWORKING', colSpan: 2 },
  { category: 'MALL' },
  { category: 'PUBLIC_SPACE' },
];

function categoryCount(
  categories: Array<{ category: string; count: number }>,
  cat: PlaceCategory,
): number {
  return categories.find((c) => c.category === cat)?.count ?? 0;
}

function CategoryMobileCard({ category, count }: { category: PlaceCategory; count: number }) {
  const label = PLACE_CATEGORY_LABELS[category];
  const icon = PLACE_CATEGORY_ICONS[category] as MaterialIconName;

  return (
    <Link href={ROUTES.categoryList(category)} className="group">
      <GlassCard className="flex flex-col items-center p-6 text-center transition-all hover:scale-[1.02] active:scale-95">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/30 transition-colors group-hover:bg-primary-container/50">
          <MaterialIcon name={icon} className="text-primary" size={32} />
        </div>
        <span className="font-title-md text-on-surface">{label}</span>
        <span className="mt-2 font-label-caps text-label-caps text-secondary">{count} PLACES</span>
      </GlassCard>
    </Link>
  );
}

function CategoryDesktopCard({
  category,
  count,
  colSpan = 1,
}: {
  category: PlaceCategory;
  count: number;
  colSpan?: 1 | 2;
}) {
  const label = PLACE_CATEGORY_LABELS[category];
  const icon = PLACE_CATEGORY_ICONS[category] as MaterialIconName;
  const photo = getPlacePhotoUrl(null, category);

  return (
    <Link
      href={ROUTES.categoryList(category)}
      className={`group ${colSpan === 2 ? 'md:col-span-2' : ''}`}
    >
      <div className="relative h-64 overflow-hidden rounded-3xl shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <img
          src={photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim-strong via-scrim-weak to-transparent" />
        <div className="absolute bottom-6 left-6 text-on-scrim">
          <div className={`flex items-center gap-3 ${colSpan === 2 ? 'mb-2' : 'mb-3'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-glass-highlight backdrop-blur-md">
              <MaterialIcon name={icon} className="text-on-scrim" size={22} />
            </div>
            {colSpan === 2 ? <span className="font-title-md text-title-md">{label}</span> : null}
          </div>
          {colSpan !== 2 ? <p className="font-title-md text-title-md">{label}</p> : null}
          <p className="font-body-sm text-on-scrim/80">
            {count} {count === 1 ? 'place' : 'places'} available
          </p>
        </div>
      </div>
    </Link>
  );
}

export function CoolingClient() {
  const [meta, setMeta] = useState<CategoryMeta | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`${API_BASE}/places/meta/categories`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: CategoryMeta };
      setMeta(json.data);
    })();
  }, []);

  const categories = meta?.categories ?? [];
  const featured = meta?.featured;

  return (
    <div className="min-h-screen pb-mobile-nav md:pb-8" data-page="cooling">
      <AppMobileHeader />
      <AppTopNav active="cooling" />

      <main className="mx-auto max-w-4xl px-margin-mobile pb-8 pt-24 md:max-w-7xl md:px-10">
        {/* Mobile hero */}
        <section className="relative mb-8 overflow-hidden rounded-xl p-6 md:hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-container/30 to-secondary-container/30 opacity-80" />
          <div className="relative z-10">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Categories
            </h2>
            <p className="mt-2 max-w-xs font-body-lg text-on-surface-variant">
              Find the perfect refuge from the heat.
            </p>
          </div>
        </section>

        {/* Desktop hero banner */}
        <section className="relative mb-10 hidden h-80 overflow-hidden rounded-[32px] shadow-sm md:block">
          <img
            src={DEFAULT_PLACE_PHOTO_PATHS.LIBRARY}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center bg-gradient-to-r from-primary/80 via-primary/30 to-transparent px-12">
            <div className="max-w-lg space-y-4 text-on-scrim">
              <h1 className="font-display-lg text-display-lg">
                Explore thermal refuges across the city.
              </h1>
              <p className="font-body-lg opacity-90">
                From quiet libraries to chilled cafés, find the perfect environment to escape urban
                heat today.
              </p>
              <Link
                href={ROUTES.explore}
                className="inline-block rounded-full bg-surface-container-lowest px-6 py-3 font-semibold text-primary shadow-lg transition-transform hover:bg-primary-fixed active:scale-95"
              >
                Discover nearby spots
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile category grid */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {DESKTOP_BENTO.map(({ category }) => (
            <CategoryMobileCard
              key={category}
              category={category}
              count={categoryCount(categories, category)}
            />
          ))}
        </div>

        {/* Desktop bento grid */}
        <section className="hidden space-y-4 md:block">
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline-lg text-headline-lg">Place Categories</h2>
            <Link
              href={ROUTES.explore}
              className="text-body-sm font-semibold text-primary hover:underline"
            >
              View interactive map
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {DESKTOP_BENTO.map(({ category, colSpan }) => (
              <CategoryDesktopCard
                key={category}
                category={category}
                count={categoryCount(categories, category)}
                colSpan={colSpan}
              />
            ))}
          </div>
        </section>

        {featured ? (
          <section className="mt-8 md:mt-10">
            <h3 className="mb-4 font-title-md text-on-surface">Today&apos;s Highlight</h3>
            <Link href={ROUTES.place(featured.slug)} className="group block">
              <div className="relative h-48 overflow-hidden rounded-xl shadow-lg md:h-56 md:rounded-2xl">
                <img
                  src={getPlacePhotoUrl(featured.photoUrl, featured.category as PlaceCategory)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim-strong to-transparent" />
                <div className="absolute bottom-0 flex flex-col justify-end p-4 md:p-6">
                  <span className="mb-2 font-label-caps text-label-caps text-on-scrim/90">
                    COLDEST PICK NEARBY
                  </span>
                  <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-on-scrim md:font-headline-lg md:text-headline-lg">
                    {featured.name}
                  </h4>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-1.5 w-4 rounded-full bg-primary" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-on-scrim/80">
                      {featured.aggregatedFreshnessLevel
                        ? FRESHNESS_LEVEL_LABELS[featured.aggregatedFreshnessLevel].toUpperCase()
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        ) : null}
      </main>

      <AppBottomNav active="cooling" />
    </div>
  );
}
