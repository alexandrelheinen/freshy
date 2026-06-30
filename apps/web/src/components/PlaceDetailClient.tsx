'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  AcStrengthBar,
  AC_STRENGTH_LABELS,
  GlassCard,
  MaterialIcon,
  PLACE_CATEGORY_LABELS,
  ROUTES,
} from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceActions } from './PlaceActions';

const SavePlaceButton = dynamic(
  () => import('./SavePlaceButton').then((m) => ({ default: m.SavePlaceButton })),
  { ssr: false },
);
import { acStrengthLevel, type PlaceDetailDto } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function PlaceDetailClient({ slug }: { slug: string }) {
  const [place, setPlace] = useState<PlaceDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`${API_BASE}/places/${slug}`);
      if (res.ok) {
        const json = (await res.json()) as { data: PlaceDetailDto };
        setPlace(json.data);
      } else {
        setPlace(null);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-10" data-page="place-detail">
        <p className="text-on-surface-variant">Loading place…</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-10" data-page="place-detail">
        <p className="text-on-surface-variant">Place not found.</p>
      </div>
    );
  }

  const categoryLabel =
    PLACE_CATEGORY_LABELS[place.category as keyof typeof PLACE_CATEGORY_LABELS] ?? place.category;

  return (
    <div className="min-h-screen pb-32 md:pb-8" data-page="place-detail">
      <AppMobileHeader title="Place Details" backHref={ROUTES.explore} showBrand={false} />
      <AppTopNav active="explore" />

      <main className="mx-auto max-w-3xl pt-16 md:max-w-4xl">
        <section className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary-container">
          <div className="absolute right-4 top-20 rounded-full bg-primary px-3 py-1.5 text-lg font-bold text-white shadow-lg md:top-24">
            {place.aggregatedTemperatureC != null
              ? `${Math.round(place.aggregatedTemperatureC)}°C`
              : '—'}
          </div>
          <div className="absolute bottom-6 left-margin-mobile md:left-10">
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold uppercase">
              {place.isOpen !== false ? 'Open now' : 'Closed'}
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white drop-shadow">{place.name}</h2>
            <p className="flex items-center gap-1 text-sm text-white/80">
              <MaterialIcon name="location_on" size={14} />
              {categoryLabel}
            </p>
          </div>
        </section>

        <section className="relative z-10 -mt-8 grid grid-cols-2 gap-4 px-margin-mobile md:px-10">
          <GlassCard className="flex flex-col items-center p-4 text-center">
            <span className="text-xs font-bold uppercase text-secondary">Interior</span>
            <div className="text-4xl font-bold text-primary">
              {place.aggregatedTemperatureC != null
                ? `${Math.round(place.aggregatedTemperatureC)}`
                : '—'}
              <span className="text-lg">°C</span>
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col items-center p-4 text-center">
            <span className="text-xs font-bold uppercase text-secondary">AC Strength</span>
            <div className="mt-2 w-full">
              <AcStrengthBar level={acStrengthLevel(place.aggregatedAcStrength)} />
            </div>
            <span className="mt-1 text-sm font-semibold text-primary">
              {place.aggregatedAcStrength
                ? AC_STRENGTH_LABELS[place.aggregatedAcStrength]
                : 'Unknown'}
            </span>
          </GlassCard>
        </section>

        <section className="mt-6 px-margin-mobile md:px-10">
          {place.address && (
            <p className="mb-4 text-sm text-on-surface-variant">{place.address}</p>
          )}
          <p className="text-on-surface-variant">{place.description}</p>
          <PlaceActions
            name={place.name}
            latitude={place.latitude}
            longitude={place.longitude}
            slug={place.slug}
          />
          <SavePlaceButton placeId={place.id} />
        </section>

        <section className="mt-8 px-margin-mobile md:px-10">
          <h3 className="mb-4 text-xl font-semibold">Climate Reviews</h3>
          {place.reviews.length === 0 ? (
            <GlassCard className="p-4 text-on-surface-variant">No reviews yet.</GlassCard>
          ) : (
            place.reviews.map((review) => (
              <GlassCard key={review.id} className="mb-3 p-4">
                <p className="italic text-on-surface-variant">
                  &quot;{review.comment ?? 'No comment.'}&quot;
                </p>
                <p className="mt-2 text-sm text-outline">— {review.user.displayName}</p>
              </GlassCard>
            ))
          )}
        </section>
      </main>

      <AppBottomNav active="explore" />
    </div>
  );
}
