'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FRESHNESS_LEVEL_LABELS,
  PLACE_TAG_ICONS,
  PLACE_TAG_LABELS,
  FreshnessSnowflakes,
  GlassCard,
  MaterialIcon,
  ROUTES,
  getPlacePhotoUrl,
  filterValidPlaceTags,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import { AppTopNav } from './AppNav';
import { PlaceActions } from './PlaceActions';

const SavePlaceButton = dynamic(
  () => import('./SavePlaceButton').then((m) => ({ default: m.SavePlaceButton })),
  { ssr: false },
);
import {
  directionsUrl,
  formatRelativeTime,
  freshnessBarState,
  staticMapUrl,
  type PlaceDetailDto,
} from '../lib/api';

import { API_BASE } from '../lib/api-base';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/places/${slug}`);
        if (res.ok) {
          const json = (await res.json()) as { data: PlaceDetailDto };
          setPlace(json.data);
        } else if (res.status === 404) {
          setPlace(null);
        } else {
          setPlace(null);
          setLoadError('Could not load this place. Check your connection and try again.');
        }
      } catch {
        setPlace(null);
        setLoadError('Could not reach the API. Check your connection and try again.');
      }
      setLoading(false);
    })();
  }, [slug]);

  const tags = useMemo(() => (place ? filterValidPlaceTags(place.tags ?? []) : []), [place]);

  const mapPreview = place
    ? staticMapUrl(place.latitude, place.longitude, MAPBOX_TOKEN || undefined)
    : null;

  async function handleShare() {
    if (!place) return;
    const url = typeof window !== 'undefined' ? window.location.href : ROUTES.place(place.slug);
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, url });
        setShareMessage('Shared.');
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage('Link copied.');
    } catch {
      setShareMessage('Could not share this place.');
    }
  }

  useEffect(() => {
    if (!shareMessage) return;
    const timer = window.setTimeout(() => setShareMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

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
        <div className="px-margin-mobile text-center">
          <p className="text-on-surface-variant">{loadError ?? 'Place not found.'}</p>
          {loadError ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-primary px-6 py-3 font-label-caps text-on-primary"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const freshness = freshnessBarState(place.aggregatedFreshnessLevel);
  const reviewScore =
    place.reviews.length > 0
      ? (
          place.reviews.reduce((sum, r) => sum + Math.min(5, Math.max(1, r.acStrength)), 0) /
          place.reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="min-h-screen pb-8" data-page="place-detail">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md md:relative md:hidden">
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
        {shareMessage ? (
          <span className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full bg-surface-container-high px-3 py-1 font-body-sm text-on-surface-variant shadow-sm">
            {shareMessage}
          </span>
        ) : null}
      </header>
      <AppTopNav active="explore" />

      <main className="mx-auto max-w-3xl pt-16 md:max-w-4xl md:pt-24">
        <div className="hidden items-center justify-end gap-3 px-10 pt-4 md:flex">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 font-label-caps text-primary transition-colors hover:bg-primary-container/20"
          >
            <MaterialIcon name="share" size={18} />
            Share
          </button>
          {shareMessage ? (
            <span className="font-body-sm text-on-surface-variant">{shareMessage}</span>
          ) : null}
        </div>
        <section className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary-container md:h-72 md:rounded-2xl">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </section>

        <div className="px-margin-mobile md:px-10">
          <h2 className="mt-6 font-display-lg text-display-lg text-on-surface">{place.name}</h2>

          <section className="relative z-10 mt-4">
            <GlassCard className="flex flex-col items-center p-4 text-center shadow-card-elevated">
              <MaterialIcon name="ac_unit" className="mb-2 text-primary" size={32} />
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                Freshness
              </span>
              <div className="mt-2 scale-90">
                <FreshnessSnowflakes segments={freshness.segments} tone={freshness.tone} />
              </div>
              <span className="mt-1 font-body-sm font-semibold text-primary">
                {place.aggregatedFreshnessLevel
                  ? FRESHNESS_LEVEL_LABELS[place.aggregatedFreshnessLevel]
                  : 'Unknown'}
              </span>
            </GlassCard>
          </section>

          <section className="mt-8">
            {tags.length > 0 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 font-label-caps text-label-caps text-on-secondary-container"
                  >
                    <MaterialIcon name={PLACE_TAG_ICONS[tag] as MaterialIconName} size={14} />
                    {PLACE_TAG_LABELS[tag]}
                  </span>
                ))}
              </div>
            ) : null}

            {place.description ? (
              <p className="mb-6 font-body-lg leading-relaxed text-on-surface-variant">
                {place.description}
              </p>
            ) : null}

            {place.address ? (
              <p className="mb-6 flex items-start gap-2 font-body-sm text-on-surface-variant">
                <MaterialIcon
                  name="location_on"
                  size={18}
                  className="mt-0.5 shrink-0 text-outline"
                />
                <span>{place.address}</span>
              </p>
            ) : null}

            <div className="space-y-3">
              <PlaceActions
                latitude={place.latitude}
                longitude={place.longitude}
                address={place.address}
              />
              <SavePlaceButton placeId={place.id} />
            </div>
          </section>
        </div>

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
        </section>

        <section className="mt-10 px-margin-mobile pb-8 md:px-10">
          <h3 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
            Location
          </h3>
          <a
            href={directionsUrl({
              latitude: place.latitude,
              longitude: place.longitude,
              address: place.address,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-48 w-full overflow-hidden rounded-2xl shadow-md transition-opacity hover:opacity-95"
          >
            {mapPreview ? (
              <img src={mapPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-secondary-container to-primary-container/30" />
            )}
            <div className="glass absolute bottom-3 left-3 flex items-center gap-2 rounded-lg px-3 py-1.5">
              <MaterialIcon name="near_me" className="text-primary" size={16} />
              <span className="font-body-sm font-medium text-on-surface">Open in Google Maps</span>
            </div>
          </a>
        </section>
      </main>
    </div>
  );
}
