'use client';

import {
  FRESHNESS_LEVEL_LABELS,
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
  return FRESHNESS_LEVEL_LABELS[id].toUpperCase();
}

export function VerifiedBadge({
  className = 'absolute -right-0.5 -top-0.5',
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <MaterialIcon
      name="verified"
      filled
      size={size}
      className={`text-primary drop-shadow-sm ${className}`}
    />
  );
}

function MarkerNameTooltip({ name }: { name: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-full z-map-overlay mb-1 whitespace-nowrap rounded-full bg-marker-label-bg px-2 py-0.5 text-[10px] font-bold text-primary opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 md:px-3 md:py-1 md:text-sm"
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
          isSelected ? 'z-map-overlay' : 'z-map opacity-80 hover:opacity-100'
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
  const sizeClass = variant === 'desktop' ? 'h-6 w-6 border-2' : 'h-8 w-8 border-4';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`marker-pulse flex items-center justify-center rounded-full border-marker-border bg-primary shadow-lg ${sizeClass}`}
      >
        <div
          className={`rounded-full bg-marker-border ${variant === 'desktop' ? 'h-2 w-2' : 'h-3 w-3'}`}
        />
      </div>
    </div>
  );
}
