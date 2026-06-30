'use client';

import Link from 'next/link';
import {
  AC_STRENGTH_LABELS,
  PLACE_TAG_LABELS,
  MaterialIcon,
  ROUTES,
  getPlacePhotoUrl,
  filterValidPlaceTags,
  type PlaceCategory,
  type PlaceTagId,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { acStrengthLevel, formatDistanceWithWalk } from '../lib/api';
import { acStrengthLabel, acStrengthPowerLabel } from './map-markers';

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
  const level = acStrengthLevel(place.aggregatedAcStrength);
  const placeTags = filterValidPlaceTags(place.tags ?? []);

  return (
    <Link href={ROUTES.place(place.slug)} className="group block">
      <article className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_4px_20px_rgba(12,103,128,0.04)]">
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary-container/40 to-secondary-container/30">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
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
          {place.aggregatedAcStrength ? (
            <div
              className={`absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-3 py-1 font-label-caps text-label-caps shadow-md ${
                place.aggregatedAcStrength === 'FRIGID'
                  ? 'bg-primary text-on-primary'
                  : place.aggregatedAcStrength === 'COMFORTABLE'
                    ? 'bg-primary/70 text-on-primary backdrop-blur-md'
                    : 'bg-primary/70 text-on-primary backdrop-blur-md'
              }`}
            >
              <MaterialIcon
                name={place.aggregatedAcStrength === 'FRIGID' ? 'ac_unit' : 'climate_mini_split'}
                size={14}
              />
              {acStrengthLabel(place.aggregatedAcStrength)}
            </div>
          ) : null}
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-start justify-between">
            <h3 className="font-title-md text-on-surface">{place.name}</h3>
            {place.aggregatedTemperatureC != null ? (
              <span className="font-headline-lg text-primary">
                {Math.round(place.aggregatedTemperatureC)}°C
              </span>
            ) : null}
          </div>
          {place.distanceKm != null ? (
            <div className="mb-3 flex items-center gap-2 text-outline">
              <MaterialIcon name="distance" size={16} />
              <span className="font-body-sm">{formatDistanceWithWalk(place.distanceKm)}</span>
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
            {place.aggregatedAcStrength ? (
              <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-bold uppercase text-on-secondary-fixed-variant">
                {AC_STRENGTH_LABELS[place.aggregatedAcStrength]}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`status-bar-segment ${i <= level ? 'active' : ''}`} />
            ))}
            <span className="ml-2 text-[10px] font-bold uppercase text-primary">
              {acStrengthPowerLabel(place.aggregatedAcStrength)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
