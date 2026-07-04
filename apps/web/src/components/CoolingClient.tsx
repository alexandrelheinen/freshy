'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  getPlacePhotoUrl,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import { AppMobileHeader, AppTopNav } from './AppNav';
import type { CategoryMeta } from '../lib/api';

import { getApiBase } from '../lib/api-base';
import { useVerifiedOnlyFilter } from '../lib/use-verified-only-filter';

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
  const photo = getPlacePhotoUrl(null, category, 'thumb');

  return (
    <Link href={ROUTES.categoryList(category)} className="group">
      <div className="relative h-36 overflow-hidden rounded-2xl shadow-sm transition-all active:scale-95">
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.84] contrast-[1.12] saturate-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-scrim-strong/75 via-scrim-weak/25 to-scrim-strong" />
        <div className="absolute top-3 left-3 right-3 text-on-scrim">
          <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-glass-highlight backdrop-blur-md">
            <MaterialIcon name={icon} className="text-on-scrim" size={18} />
          </div>
          <span className="block max-w-[10rem] font-title-md text-title-md leading-tight">{label}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <span className="font-label-caps text-label-caps text-on-scrim/80">
            {count} {count === 1 ? 'PLACE' : 'PLACES'}
          </span>
        </div>
      </div>
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
  const { verifiedOnly } = useVerifiedOnlyFilter();

  useEffect(() => {
    void (async () => {
      const search = new URLSearchParams();
      if (verifiedOnly) search.set('verifiedOnly', 'true');
      const query = search.toString();
      const res = await fetch(
        `${getApiBase()}/places/meta/categories${query ? `?${query}` : ''}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { data: CategoryMeta };
      setMeta(json.data);
    })();
  }, [verifiedOnly]);

  const categories = meta?.categories ?? [];

  return (
    <div className="min-h-screen pb-8" data-page="cooling">
      <AppMobileHeader active="cooling" />
      <AppTopNav active="cooling" />

      <main className="mx-auto max-w-4xl px-margin-mobile pb-8 pt-24 md:max-w-7xl md:px-10">
        {/* Mobile hero */}
        <section className="mb-8 md:hidden">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Explore place categories
          </h2>
        </section>

        {/* Desktop header */}
        <section className="mb-10 hidden md:block">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Explore place categories
          </h1>
          <p className="mt-2 max-w-2xl font-body-lg text-on-surface-variant">
            Browse places by type and open the map when you are ready to search nearby.
          </p>
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
      </main>
    </div>
  );
}
