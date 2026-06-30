'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AC_STRENGTH_LABELS,
  AMENITY_ICONS,
  AMENITY_LABELS,
  AcStrengthSnowflakes,
  CATEGORY_DEFAULT_AMENITIES,
  GlassCard,
  MaterialIcon,
  ROUTES,
  getPlacePhotoUrl,
  type MaterialIconName,
  type PlaceAmenity,
  type PlaceCategory,
} from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceActions } from './PlaceActions';

const SavePlaceButton = dynamic(
  () => import('./SavePlaceButton').then((m) => ({ default: m.SavePlaceButton })),
  { ssr: false },
);
import {
  acStrengthLevel,
  formatRelativeTime,
  staticMapUrl,
  type PlaceDetailDto,
} from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

function resolveAmenities(
  amenities: string[] | undefined,
  category: PlaceCategory,
): PlaceAmenity[] {
  if (amenities && amenities.length > 0) {
    return amenities.filter((a): a is PlaceAmenity => a in AMENITY_LABELS);
  }
  return CATEGORY_DEFAULT_AMENITIES[category] ?? [];
}

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

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

  const amenities = useMemo(
    () =>
      place
        ? resolveAmenities(place.amenities, place.category as PlaceCategory)
        : [],
    [place],
  );

  const mapPreview = place
    ? staticMapUrl(place.latitude, place.longitude, MAPBOX_TOKEN || undefined)
    : null;

  async function handleShare() {
    if (!place) return;
    const url = typeof window !== 'undefined' ? window.location.href : ROUTES.place(place.slug);
    if (navigator.share) {
      await navigator.share({ title: place.name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

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

  const strengthLevel = acStrengthLevel(place.aggregatedAcStrength);
  const reviewScore =
    place.reviews.length > 0
      ? (
          place.reviews.reduce((sum, r) => sum + Math.min(5, Math.max(1, r.acStrength)), 0) /
          place.reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="min-h-screen pb-32 md:pb-8" data-page="place-detail">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.explore}
            className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95"
            aria-label="Go back"
          >
            <MaterialIcon name="arrow_back" />
          </Link>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary">
            Place Details
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95"
          aria-label="Share"
        >
          <MaterialIcon name="share" />
        </button>
      </header>
      <AppTopNav active="explore" />

      <main className="mx-auto max-w-3xl pt-16 md:max-w-4xl md:pt-24">
        <section className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary-container md:h-80 md:rounded-2xl">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-margin-mobile md:left-10">
            <span className="inline-block rounded-full bg-primary-container px-3 py-1 font-label-caps text-label-caps text-on-primary-container">
              {place.isOpen !== false ? 'OPEN NOW' : 'CLOSED'}
            </span>
            <h2 className="mt-2 font-display-lg text-display-lg text-white drop-shadow-md">
              {place.name}
            </h2>
          </div>
        </section>

        <section className="relative z-10 -mt-8 grid grid-cols-2 gap-4 px-margin-mobile md:px-10">
          <GlassCard className="flex flex-col items-center p-4 text-center shadow-[0_20px_20px_rgba(12,103,128,0.04)]">
            <MaterialIcon name="thermostat" className="mb-2 text-primary" size={36} />
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
              Interior
            </span>
            <div className="mt-1 flex items-baseline">
              <span className="font-display-lg text-display-lg text-primary">
                {place.aggregatedTemperatureC != null
                  ? Math.round(place.aggregatedTemperatureC)
                  : '—'}
              </span>
              {place.aggregatedTemperatureC != null ? (
                <span className="ml-1 font-title-md text-primary">°C</span>
              ) : null}
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col items-center p-4 text-center shadow-[0_20px_20px_rgba(12,103,128,0.04)]">
            <MaterialIcon name="ac_unit" className="mb-2 text-primary" size={36} />
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
              AC Strength
            </span>
            <div className="mt-2">
              <AcStrengthSnowflakes level={strengthLevel} />
            </div>
            <span className="mt-1 font-body-sm font-semibold text-primary">
              {place.aggregatedAcStrength
                ? AC_STRENGTH_LABELS[place.aggregatedAcStrength]
                : 'Unknown'}
            </span>
          </GlassCard>
        </section>

        <section className="mt-6 px-margin-mobile md:px-10">
          <div className="mb-6 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 font-label-caps text-label-caps text-on-secondary-container"
              >
                <MaterialIcon
                  name={AMENITY_ICONS[amenity] as MaterialIconName}
                  size={14}
                />
                {AMENITY_LABELS[amenity]}
              </span>
            ))}
          </div>
          {place.address ? (
            <p className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant">
              <MaterialIcon name="location_on" size={16} />
              {place.address}
            </p>
          ) : null}
          <p className="font-body-lg leading-relaxed text-on-surface-variant">{place.description}</p>
          <PlaceActions
            name={place.name}
            latitude={place.latitude}
            longitude={place.longitude}
            slug={place.slug}
          />
          <SavePlaceButton placeId={place.id} />
        </section>

        <section className="mt-8 px-margin-mobile md:px-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
              Climate Reviews
            </h3>
            {reviewScore ? (
              <span className="flex items-center gap-1 font-title-md text-primary">
                <MaterialIcon name="star" filled size={20} />
                {reviewScore}
              </span>
            ) : null}
          </div>
          {place.reviews.length === 0 ? (
            <GlassCard className="p-4 text-on-surface-variant">No reviews yet.</GlassCard>
          ) : (
            <div className="space-y-4">
              {place.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                      {userInitials(review.user.displayName)}
                    </div>
                    <div>
                      <h4 className="font-title-md leading-none text-on-surface">
                        {review.user.displayName}
                      </h4>
                      <span className="font-body-sm text-outline">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="font-body-lg italic text-on-surface-variant">
                    &quot;{review.comment ?? 'No comment.'}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
          {place.reviews.length > 0 ? (
            <button
              type="button"
              className="mt-6 w-full rounded-xl border-2 border-primary-container py-3 font-title-md text-primary transition-colors hover:bg-primary/5"
            >
              View all reviews
            </button>
          ) : null}
        </section>

        <section className="mt-8 px-margin-mobile pb-8 md:px-10">
          <h3 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
            Location
          </h3>
          <div className="relative h-48 w-full overflow-hidden rounded-2xl shadow-md">
            {mapPreview ? (
              <img src={mapPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-secondary-container to-primary-container/30" />
            )}
            <div className="glass absolute bottom-3 left-3 flex items-center gap-2 rounded-lg px-3 py-1.5">
              <MaterialIcon name="near_me" className="text-primary" size={16} />
              <span className="font-body-sm font-medium text-on-surface">
                {place.address ?? 'View on map'}
              </span>
            </div>
          </div>
        </section>
      </main>

      <AppBottomNav active="explore" />
    </div>
  );
}
