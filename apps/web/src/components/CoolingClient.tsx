'use client';

import { useEffect, useState } from 'react';
import { GlassCard, PLACE_CATEGORY_LABELS, AC_STRENGTH_LABELS } from '@freshy/ui';
import { AppBottomNav } from './AppBottomNav';
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
    <div className="min-h-screen pb-32" data-page="cooling">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <h1 className="text-2xl font-bold text-primary">Freshy</h1>
      </header>

      <main className="mx-auto max-w-4xl px-margin-mobile pt-24">
        <section className="mb-8 rounded-xl bg-gradient-to-br from-primary-container/20 to-secondary-container/20 p-6">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <p className="mt-2 text-on-surface-variant">Find the perfect refuge from the heat.</p>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((cat) => (
            <GlassCard key={cat.category} className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/30 text-2xl">
                ❄
              </div>
              <span className="font-semibold">
                {PLACE_CATEGORY_LABELS[cat.category as keyof typeof PLACE_CATEGORY_LABELS] ??
                  cat.category}
              </span>
              <span className="mt-2 text-xs font-bold uppercase text-secondary">
                {cat.count} places
              </span>
            </GlassCard>
          ))}
        </div>

        {featured && (
          <section className="mt-8">
            <h3 className="mb-4 text-lg font-semibold">Today&apos;s Highlight</h3>
            <GlassCard className="h-48 overflow-hidden">
              <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/50 to-primary-container/30 p-4">
                <span className="text-xs font-bold uppercase text-white/90">
                  Coldest pick nearby
                </span>
                <h4 className="text-xl font-semibold text-white">{featured.name}</h4>
                <p className="text-sm text-white/80">
                  {featured.aggregatedTemperatureC != null
                    ? `${Math.round(featured.aggregatedTemperatureC)}°C · `
                    : ''}
                  {featured.aggregatedAcStrength
                    ? AC_STRENGTH_LABELS[featured.aggregatedAcStrength]
                    : ''}
                </p>
              </div>
            </GlassCard>
          </section>
        )}
      </main>

      <AppBottomNav active="cooling" />
    </div>
  );
}
