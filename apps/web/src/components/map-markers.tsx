'use client';

import {
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';

export function markerPinStyle(strength: PlaceDto['aggregatedAcStrength']): {
  bgClass: string;
  opacity: string;
} {
  if (strength === 'FRIGID') return { bgClass: 'bg-primary', opacity: '' };
  if (strength === 'COMFORTABLE') return { bgClass: 'bg-primary', opacity: 'opacity-80' };
  return { bgClass: 'bg-primary', opacity: 'opacity-60' };
}

export function desktopMarkerStyle(strength: PlaceDto['aggregatedAcStrength']): {
  badgeClass: string;
  pinClass: string;
  textClass: string;
} {
  if (strength === 'FRIGID') {
    return {
      badgeClass: 'bg-primary text-white',
      pinClass: 'bg-primary',
      textClass: 'text-primary',
    };
  }
  if (strength === 'COMFORTABLE') {
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
  return (icon ?? 'cyclone') as MaterialIconName;
}

export function acStrengthLabel(strength: PlaceDto['aggregatedAcStrength']): string {
  if (strength === 'FRIGID') return 'FRIGID';
  if (strength === 'COMFORTABLE') return 'COMFORTABLE';
  return 'COOLED';
}

export function acStrengthPowerLabel(strength: PlaceDto['aggregatedAcStrength']): string {
  if (strength === 'FRIGID') return 'MAX POWER';
  if (strength === 'COMFORTABLE') return 'COMFORTABLE';
  return 'LIGHT COOLING';
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
  const { bgClass, opacity } = markerPinStyle(place.aggregatedAcStrength);
  const desktop = desktopMarkerStyle(place.aggregatedAcStrength);
  const temp =
    place.aggregatedTemperatureC != null ? `${Math.round(place.aggregatedTemperatureC)}°C` : null;

  if (variant === 'desktop') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-center transition-transform hover:scale-110 ${
          isSelected ? 'z-20' : 'z-10 opacity-80 hover:opacity-100'
        }`}
      >
        {temp ? (
          <div
            className={`mb-1 whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold shadow-lg ${desktop.badgeClass}`}
          >
            {temp}
          </div>
        ) : null}
        <div
          className={`flex items-center justify-center rounded-full border-2 border-white shadow-xl ${
            isSelected ? 'marker-pulse h-10 w-10' : 'h-8 w-8'
          } ${desktop.pinClass}`}
        >
          <MaterialIcon
            name={icon}
            className={isSelected ? 'text-white' : desktop.textClass}
            filled={isSelected}
            size={isSelected ? 20 : 18}
          />
        </div>
        {isSelected ? <div className="h-2 w-0.5 bg-primary" /> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`marker-float flex flex-col items-center transition-transform hover:scale-110 ${opacity}`}
      style={{ animationDelay: `${place.id.charCodeAt(0) % 5 * 0.4}s` }}
    >
      <div
        className={`rounded-full p-2 text-white shadow-xl ${bgClass} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-primary/30' : ''}`}
      >
        <MaterialIcon name={icon} size={20} />
      </div>
      {isSelected ? (
        <div className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary shadow-sm backdrop-blur-sm">
          {place.name.length > 16 ? `${place.name.slice(0, 14)}…` : place.name}
        </div>
      ) : null}
    </button>
  );
}

export function UserLocationMarker({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
  if (variant === 'desktop') return null;

  return (
    <div className="flex flex-col items-center">
      <div className="marker-pulse flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-primary shadow-lg">
        <div className="h-3 w-3 rounded-full bg-white" />
      </div>
    </div>
  );
}
