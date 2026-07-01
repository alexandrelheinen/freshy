'use client';

import {
  FRESHNESS_LEVEL_SHORT_LABELS,
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  freshnessBarSegments,
  freshnessTone,
  type FreshnessLevelId,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { isPlaceVerified } from '../lib/api';
import { truncatePlaceName } from '../lib/truncate-place-name';

function freshnessId(
  strength: PlaceDto['aggregatedFreshnessLevel'],
): FreshnessLevelId | null | undefined {
  return strength as FreshnessLevelId | null | undefined;
}

export function markerPinStyle(strength: PlaceDto['aggregatedFreshnessLevel']): {
  bgClass: string;
  opacity: string;
} {
  const tone = freshnessTone(freshnessId(strength));
  if (tone === 'green') return { bgClass: 'bg-success', opacity: '' };
  const segments = freshnessBarSegments(freshnessId(strength));
  if (segments >= 3) return { bgClass: 'bg-primary', opacity: '' };
  if (segments === 2) return { bgClass: 'bg-primary', opacity: 'opacity-80' };
  return { bgClass: 'bg-primary', opacity: 'opacity-60' };
}

export function desktopMarkerStyle(strength: PlaceDto['aggregatedFreshnessLevel']): {
  badgeClass: string;
  pinClass: string;
  textClass: string;
} {
  const tone = freshnessTone(freshnessId(strength));
  if (tone === 'green') {
    return {
      badgeClass: 'bg-success text-on-success',
      pinClass: 'bg-success',
      textClass: 'text-on-success-container',
    };
  }
  const segments = freshnessBarSegments(freshnessId(strength));
  if (segments >= 3) {
    return {
      badgeClass: 'bg-primary text-on-primary',
      pinClass: 'bg-primary',
      textClass: 'text-primary',
    };
  }
  if (segments === 2) {
    return {
      badgeClass: 'bg-primary-container text-on-primary-container',
      pinClass: 'bg-primary-container',
      textClass: 'text-secondary',
    };
  }
  return {
    badgeClass: 'bg-tertiary-container text-on-tertiary-container',
    pinClass: 'bg-tertiary-container',
    textClass: 'text-tertiary',
  };
}

export function categoryIcon(category: string): MaterialIconName {
  const icon = PLACE_CATEGORY_ICONS[category as PlaceCategory];
  return (icon ?? 'climate_mini_split') as MaterialIconName;
}

export function freshnessLabel(strength: PlaceDto['aggregatedFreshnessLevel']): string {
  const id = freshnessId(strength);
  if (!id) return 'UNKNOWN';
  return FRESHNESS_LEVEL_SHORT_LABELS[id].toUpperCase();
}

export function freshnessPowerLabel(strength: PlaceDto['aggregatedFreshnessLevel']): string {
  const id = freshnessId(strength);
  if (!id) return 'UNKNOWN';
  return FRESHNESS_LEVEL_SHORT_LABELS[id].toUpperCase();
}

/** @deprecated Use freshnessLabel */
export const acStrengthLabel = freshnessLabel;

/** @deprecated Use freshnessPowerLabel */
export const acStrengthPowerLabel = freshnessPowerLabel;

function VerifiedBadge() {
  return (
    <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-surface bg-primary shadow-sm md:h-5 md:w-5">
      <MaterialIcon name="verified" filled size={10} className="text-on-primary md:hidden" />
      <MaterialIcon
        name="verified"
        filled
        size={12}
        className="hidden text-on-primary md:block"
      />
    </div>
  );
}

function MarkerNameTooltip({ name }: { name: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-full z-30 mb-1 whitespace-nowrap rounded-full bg-marker-label-bg px-2 py-0.5 text-[10px] font-bold text-primary opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 md:px-3 md:py-1 md:text-sm"
      aria-hidden
    >
      {truncatePlaceName(name)}
    </div>
  );
}

export function PlaceMapMarker({
  place,
  isSelected,
  variant = 'mobile',
  onClick,
}: {
  place: PlaceDto;
  isSelected?: boolean;
  variant?: 'mobile' | 'desktop';
  onClick?: () => void;
}) {
  const icon = categoryIcon(place.category);
  const { bgClass, opacity } = markerPinStyle(place.aggregatedFreshnessLevel);
  const desktop = desktopMarkerStyle(place.aggregatedFreshnessLevel);
  const verified = isPlaceVerified(place);

  if (variant === 'desktop') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={place.name}
        className={`group relative flex flex-col items-center transition-transform hover:scale-110 ${
          isSelected ? 'z-20' : 'z-10 opacity-80 hover:opacity-100'
        }`}
      >
        <MarkerNameTooltip name={place.name} />
        <div className="relative">
          <div
            className={`flex items-center justify-center rounded-full border-2 border-marker-border shadow-xl ${
              isSelected ? 'marker-pulse h-10 w-10' : 'h-8 w-8'
            } ${desktop.pinClass}`}
          >
            <MaterialIcon
              name={icon}
              className={isSelected ? 'text-on-primary' : desktop.textClass}
              filled={isSelected}
              size={isSelected ? 20 : 18}
            />
          </div>
          {verified ? <VerifiedBadge /> : null}
        </div>
        {isSelected ? <div className="h-2 w-0.5 bg-primary" /> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={place.name}
      className={`marker-float group relative flex flex-col items-center transition-transform hover:scale-110 ${opacity}`}
      style={{ animationDelay: `${(place.id.charCodeAt(0) % 5) * 0.4}s` }}
    >
      <MarkerNameTooltip name={place.name} />
      <div className="relative">
        <div
          className={`rounded-full p-2 text-on-primary shadow-xl ${bgClass} ${isSelected ? 'ring-2 ring-marker-ring ring-offset-2 ring-offset-primary/30' : ''}`}
        >
          <MaterialIcon name={icon} size={20} />
        </div>
        {verified ? <VerifiedBadge /> : null}
      </div>
    </button>
  );
}

export function UserLocationMarker({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
  if (variant === 'desktop') return null;

  return (
    <div className="flex flex-col items-center">
      <div className="marker-pulse flex h-8 w-8 items-center justify-center rounded-full border-4 border-marker-border bg-primary shadow-lg">
        <div className="h-3 w-3 rounded-full bg-marker-border" />
      </div>
    </div>
  );
}
