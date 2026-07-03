'use client';

import Link from 'next/link';
import {
  FRESHNESS_LEVEL_LABELS,
  PLACE_TAG_LABELS,
  MaterialIcon,
  ROUTES,
  getPlacePhotoUrl,
  filterValidPlaceTags,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { freshnessBarState, isPlaceVerified } from '../lib/api';
import { formatPlaceDistanceFromUser } from '../lib/place-distance';
import { useUserLocation } from '../lib/use-user-location';
import { freshnessLabel } from './map-markers';
import { FreshnessBar } from '@freshy/ui';

export function PlaceListCard({
  place,
  showBookmark = false,
  bookmarkFilled = false,
  onBookmarkClick,
}: {
  place: PlaceDto;
  showBookmark?: boolean;
  bookmarkFilled?: boolean;
  onBookmarkClick?: () => void;
}) {
  const { location } = useUserLocation();
  const bar = freshnessBarState(place.aggregatedFreshnessLevel);
  const placeTags = filterValidPlaceTags(place.tags ?? []);
  const isGreen = bar.tone === 'green';
  const verified = isPlaceVerified(place);
  const distanceLabel = formatPlaceDistanceFromUser(place, location);

  return (
    <Link href={ROUTES.place(place.slug)} className="group block">
      <article className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-card">
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary-container/40 to-secondary-container/30">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {verified ? (
            <div
              className={`absolute top-3 flex h-7 w-7 items-center justify-center rounded-full border border-surface bg-primary shadow-sm ${
                showBookmark ? 'right-14' : 'right-3'
              }`}
            >
              <MaterialIcon name="verified" filled size={16} className="text-on-primary" />
            </div>
          ) : null}
          {showBookmark ? (
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onBookmarkClick?.();
                }}
                className="glass flex h-10 w-10 items-center justify-center rounded-full text-primary shadow-sm transition-transform active:scale-90"
                aria-label={bookmarkFilled ? 'Remove from saved' : 'Save place'}
              >
                <MaterialIcon name="bookmark_heart" filled={bookmarkFilled} />
              </button>
            </div>
          ) : null}
          {place.aggregatedFreshnessLevel ? (
            <div
              className={`absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-3 py-1 font-label-caps text-label-caps shadow-md ${
                isGreen
                  ? 'bg-success text-on-success'
                  : bar.segments >= 3
                    ? 'bg-primary text-on-primary'
                    : 'bg-primary/70 text-on-primary backdrop-blur-md'
              }`}
            >
              <MaterialIcon
                name={isGreen ? 'nature' : bar.segments >= 3 ? 'ac_unit' : 'climate_mini_split'}
                size={14}
              />
              {freshnessLabel(place.aggregatedFreshnessLevel)}
            </div>
          ) : null}
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-start justify-between">
            <h3 className="font-title-md text-on-surface">{place.name}</h3>
          </div>
          {distanceLabel ? (
            <div className="mb-3 flex items-center gap-2 text-outline">
              <MaterialIcon name="distance" size={16} />
              <span className="font-body-sm">{distanceLabel}</span>
            </div>
          ) : null}
          <div className="mb-4 flex flex-wrap gap-2">
            {placeTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-bold uppercase text-on-secondary-fixed-variant"
              >
                {PLACE_TAG_LABELS[tag]}
              </span>
            ))}
            {place.aggregatedFreshnessLevel ? (
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                  isGreen
                    ? 'bg-success-container text-on-success-container'
                    : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                }`}
              >
                {FRESHNESS_LEVEL_LABELS[place.aggregatedFreshnessLevel]}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <FreshnessBar segments={bar.segments} tone={bar.tone} />
            <span
              className={`text-[10px] font-bold uppercase ${
                isGreen ? 'text-success' : 'text-primary'
              }`}
            >
              {freshnessLabel(place.aggregatedFreshnessLevel)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
