'use client';

import Link from 'next/link';
import {
  PLACE_TAG_LABELS,
  MaterialIcon,
  ROUTES,
  filterValidPlaceTags,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { freshnessBarState, isPlaceVerified } from '../lib/api';
import { formatPlaceDistanceFromUser } from '../lib/place-distance';
import { useUserLocation } from '../lib/use-user-location';
import { freshnessLabel } from './map-markers';
import { FreshnessBar } from '@freshy/ui';
import { PlacePhoto } from './PlacePhoto';

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
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-primary-container/40 to-secondary-container/30">
          <PlacePhoto
            photoUrl={place.photoUrl}
            category={place.category as PlaceCategory}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {verified ? (
            <div
              className={`absolute top-2 flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-primary shadow-sm ${
                showBookmark ? 'right-11' : 'right-2'
              }`}
            >
              <MaterialIcon name="verified" filled size={16} className="text-on-primary" />
            </div>
          ) : null}
          {showBookmark ? (
            <div className="absolute right-2 top-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onBookmarkClick?.();
                }}
                className="glass flex h-8 w-8 items-center justify-center rounded-full text-primary shadow-sm transition-transform active:scale-90"
                aria-label={bookmarkFilled ? 'Remove from saved' : 'Save place'}
              >
                <MaterialIcon name="bookmark_heart" filled={bookmarkFilled} />
              </button>
            </div>
          ) : null}
          {place.aggregatedFreshnessLevel ? (
            <div
              className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 font-label-caps text-[10px] shadow-md ${
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
        <div className="p-2">
          <h3 className="truncate font-title-md text-on-surface">{place.name}</h3>
          {distanceLabel ? (
            <div className="mt-1 flex items-center gap-1 text-outline">
              <MaterialIcon name="distance" size={14} />
              <span className="truncate font-body-sm text-[11px]">{distanceLabel}</span>
            </div>
          ) : null}
          {placeTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {placeTags.slice(0, 1).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[9px] font-bold uppercase text-on-secondary-fixed-variant"
                >
                  {PLACE_TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-1.5">
            <FreshnessBar segments={bar.segments} tone={bar.tone} />
            <span
              className={`truncate text-[9px] font-bold uppercase ${
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
