'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GlassCard,
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import { AC_STRENGTH_LABELS } from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import type { CategoryMeta } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
    <div className="min-h-screen pb-32 md:pb-8" data-page="cooling">
      <AppMobileHeader />
      <AppTopNav active="cooling" />

      <main className="mx-auto max-w-4xl px-margin-mobile pb-8 pt-24 md:max-w-5xl md:px-10">
        <section className="relative mb-8 overflow-hidden rounded-xl p-6">
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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((cat) => {
            const label =
              PLACE_CATEGORY_LABELS[cat.category as PlaceCategory] ?? cat.category;
            const icon = (PLACE_CATEGORY_ICONS[cat.category as PlaceCategory] ??
              'cyclone') as MaterialIconName;

            return (
              <Link
                key={cat.category}
                href={ROUTES.categoryList(cat.category as PlaceCategory)}
                className="group"
              >
                <GlassCard className="flex flex-col items-center p-6 text-center transition-all hover:scale-[1.02] active:scale-95">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/30 transition-colors group-hover:bg-primary-container/50">
                    <MaterialIcon name={icon} className="text-primary" size={32} />
                  </div>
                  <span className="font-title-md text-on-surface">{label}</span>
                  <span className="mt-2 font-label-caps text-label-caps text-secondary">
                    {cat.count} PLACES
                  </span>
                </GlassCard>
              </Link>
            );
          })}
        </div>

        {featured ? (
          <section className="mt-8 md:mt-10">
            <h3 className="mb-4 font-title-md text-on-surface">Today&apos;s Highlight</h3>
            <Link href={ROUTES.place(featured.slug)} className="group block">
              <div className="relative h-48 overflow-hidden rounded-xl shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container/50 to-secondary-container/40 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 flex flex-col justify-end p-4">
                  <span className="mb-2 font-label-caps text-label-caps text-white/90">
                    COLDEST PICK NEARBY
                  </span>
                  <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-white">
                    {featured.name}
                  </h4>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-1.5 w-4 rounded-full bg-primary" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-white/80">
                      {featured.aggregatedAcStrength
                        ? AC_STRENGTH_LABELS[featured.aggregatedAcStrength].toUpperCase()
                        : ''}
                      {featured.aggregatedTemperatureC != null
                        ? ` · ${Math.round(featured.aggregatedTemperatureC)}°C`
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
