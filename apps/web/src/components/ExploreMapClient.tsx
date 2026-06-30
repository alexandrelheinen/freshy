'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import Link from 'next/link';
import {
  AcStrengthBar,
  AC_STRENGTH_LABELS,
  EXPLORE_FILTER_CHIPS,
  GlassCard,
  MaterialIcon,
  PILOT_CITY,
  PLACE_CATEGORY_ICONS,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { acStrengthLevel, directionsUrl, formatDistance } from '../lib/api';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceMapMarker, UserLocationMarker, acStrengthLabel } from './map-markers';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const DEFAULT_CENTER = { latitude: PILOT_CITY.latitude, longitude: PILOT_CITY.longitude };

function chipIcon(category?: PlaceCategory): MaterialIconName | null {
  if (!category) return null;
  return (PLACE_CATEGORY_ICONS[category] ?? null) as MaterialIconName | null;
}

function ExplorePreviewCard({
  place,
  variant = 'mobile',
}: {
  place: PlaceDto;
  variant?: 'mobile' | 'desktop';
}) {
  const strengthLevel = acStrengthLevel(place.aggregatedAcStrength);

  if (variant === 'desktop') {
    return (
      <div className="glass-panel pointer-events-auto overflow-hidden rounded-2xl border border-white/50 shadow-2xl">
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-container/40 to-secondary-container/30">
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-lg font-bold text-white shadow-lg">
            {place.aggregatedTemperatureC != null
              ? `${Math.round(place.aggregatedTemperatureC)}°C`
              : '—'}
            <span className="h-4 w-px bg-white/30" />
            <MaterialIcon name="ac_unit" size={16} />
          </div>
          <div className="absolute bottom-4 left-4 flex gap-2">
            {place.aggregatedAcStrength ? (
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
                AC: {AC_STRENGTH_LABELS[place.aggregatedAcStrength]}
              </span>
            ) : null}
          </div>
        </div>
        <div className="p-6">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h1 className="font-headline-lg text-on-surface">{place.name}</h1>
              {place.address ? (
                <p className="mt-1 flex items-center gap-1 text-on-surface-variant">
                  <MaterialIcon name="location_on" size={16} />
                  {place.address}
                </p>
              ) : null}
            </div>
          </div>
          <div className="my-6 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center rounded-xl bg-surface-container-low p-3 text-center">
              <MaterialIcon name="thermometer" className="mb-1 text-primary" />
              <span className="text-[10px] font-bold uppercase text-outline-variant">Current</span>
              <span className="font-bold text-on-surface">
                {place.aggregatedTemperatureC != null
                  ? `${place.aggregatedTemperatureC.toFixed(1)}°C`
                  : '—'}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-surface-container-low p-3 text-center">
              <MaterialIcon name="air" className="mb-1 text-primary" />
              <span className="text-[10px] font-bold uppercase text-outline-variant">Strength</span>
              <span className="font-bold text-on-surface">
                {place.aggregatedAcStrength
                  ? AC_STRENGTH_LABELS[place.aggregatedAcStrength]
                  : '—'}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-surface-container-low p-3 text-center">
              <MaterialIcon name="group" className="mb-1 text-primary" />
              <span className="text-[10px] font-bold uppercase text-outline-variant">Category</span>
              <span className="text-xs font-bold text-on-surface">
                {PLACE_CATEGORY_LABELS[place.category as PlaceCategory] ?? place.category}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-on-surface">Coolness Score</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full ${i <= strengthLevel ? 'bg-primary' : 'bg-surface-container-highest'}`}
                  />
                ))}
                <span className="ml-2 font-bold text-primary">
                  {place.aggregatedAcStrength === 'FRIGID'
                    ? 'Icy'
                    : place.aggregatedAcStrength === 'COMFORTABLE'
                      ? 'Cool'
                      : 'Mild'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={directionsUrl(place.latitude, place.longitude, place.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <MaterialIcon name="directions" />
                Get Directions
              </a>
              <Link
                href={ROUTES.place(place.slug)}
                className="flex w-14 items-center justify-center rounded-xl bg-secondary-container py-3 font-bold text-on-secondary-container transition-colors hover:bg-secondary-container/80"
              >
                <MaterialIcon name="share" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={ROUTES.place(place.slug)}>
      <GlassCard className="flex items-center gap-4 rounded-2xl border border-white/60 p-4 shadow-2xl transition hover:shadow-md">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-container/50 to-secondary-container/40" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-headline-lg-mobile leading-tight text-on-surface">{place.name}</h2>
              <p className="flex items-center gap-1 font-body-sm text-secondary">
                <MaterialIcon name="location_on" size={14} />
                {formatDistance(place.distanceKm)}
                {place.distanceKm != null ? ' away' : ''}
              </p>
            </div>
            {place.aggregatedTemperatureC != null ? (
              <div className="flex items-center gap-1 rounded-lg bg-primary-fixed px-2 py-1 text-lg font-bold text-on-primary-fixed shadow-sm">
                {Math.round(place.aggregatedTemperatureC)}°C
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-primary">
                {acStrengthLabel(place.aggregatedAcStrength)} STRENGTH
              </span>
              <AcStrengthBar level={strengthLevel} />
            </div>
            <div className="rounded bg-secondary-container px-2 py-1 text-[9px] font-bold uppercase text-on-secondary-container">
              {PLACE_CATEGORY_LABELS[place.category as PlaceCategory] ?? place.category}
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

function NearbyListItem({
  place,
  isSelected,
  onSelect,
}: {
  place: PlaceDto;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg p-3 text-left transition-colors ${
        isSelected
          ? 'border border-primary/20 bg-primary-container/30 hover:bg-primary-container/40'
          : 'hover:bg-surface-container'
      }`}
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary-container/40 to-secondary-container/30" />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-on-surface">{place.name}</h3>
            {place.aggregatedTemperatureC != null ? (
              <span className="text-xs font-bold text-primary">
                {Math.round(place.aggregatedTemperatureC)}°C
              </span>
            ) : null}
          </div>
          {place.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">{place.description}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {place.aggregatedAcStrength ? (
              <span className="flex items-center text-[10px] font-bold text-primary">
                <MaterialIcon name="ac_unit" size={14} className="mr-1" />
                {AC_STRENGTH_LABELS[place.aggregatedAcStrength]}
              </span>
            ) : null}
            {place.distanceKm != null ? (
              <span className="text-[10px] text-outline">• {formatDistance(place.distanceKm)} away</span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ExploreMapClient({ initialPlaces }: { initialPlaces: PlaceDto[] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialPlaces[0]?.slug ?? null,
  );
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | undefined>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewState, setViewState] = useState<{
    latitude: number;
    longitude: number;
    zoom: number;
  }>({
    latitude: DEFAULT_CENTER.latitude,
    longitude: DEFAULT_CENTER.longitude,
    zoom: 13,
  });

  const selected = useMemo(
    () => places.find((p) => p.slug === selectedSlug) ?? places[0],
    [places, selectedSlug],
  );

  const loadPlaces = useCallback(
    async (opts: { lat?: number; lng?: number; category?: string; q?: string }) => {
      const params = new URLSearchParams();
      const lat = opts.lat ?? userLocation?.lat ?? DEFAULT_CENTER.latitude;
      const lng = opts.lng ?? userLocation?.lng ?? DEFAULT_CENTER.longitude;
      params.set('lat', String(lat));
      params.set('lng', String(lng));
      params.set('radius', '3');
      if (opts.category) params.set('category', opts.category);
      if (opts.q) params.set('q', opts.q);

      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${base}/places?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: PlaceDto[] };
      setPlaces(json.data);
      if (json.data[0] && !json.data.some((p) => p.slug === selectedSlug)) {
        setSelectedSlug(json.data[0].slug);
      }
    },
    [selectedSlug, userLocation],
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setViewState((v) => ({ ...v, latitude: lat, longitude: lng }));
        void loadPlaces({ lat, lng, category: activeCategory, q: query || undefined });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [activeCategory, loadPlaces, query]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadPlaces({ category: activeCategory, q: query || undefined });
    }, 300);
    return () => clearTimeout(handle);
  }, [query, activeCategory, loadPlaces]);

  const zoomIn = () => setViewState((v) => ({ ...v, zoom: Math.min(v.zoom + 1, 18) }));
  const zoomOut = () => setViewState((v) => ({ ...v, zoom: Math.max(v.zoom - 1, 8) }));
  const recenter = () => {
    if (userLocation) {
      setViewState((v) => ({
        ...v,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      }));
    }
  };

  const mapContent = MAPBOX_TOKEN ? (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      {userLocation ? (
        <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
          <UserLocationMarker variant="mobile" />
        </Marker>
      ) : null}
      {places.map((place) => (
        <Marker
          key={place.id}
          latitude={place.latitude}
          longitude={place.longitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedSlug(place.slug);
          }}
        >
          <div className="hidden md:block">
            <PlaceMapMarker
              place={place}
              isSelected={place.slug === selectedSlug}
              variant="desktop"
              onClick={() => setSelectedSlug(place.slug)}
            />
          </div>
          <div className="md:hidden">
            <PlaceMapMarker
              place={place}
              isSelected={place.slug === selectedSlug}
              variant="mobile"
              onClick={() => setSelectedSlug(place.slug)}
            />
          </div>
        </Marker>
      ))}
    </Map>
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-secondary-container via-surface to-primary-container/30" />
  );

  const filterChips = (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      <button
        type="button"
        onClick={() => setActiveCategory(undefined)}
        className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-colors ${
          activeCategory == null
            ? 'bg-primary text-white'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
        }`}
      >
        All Spots
      </button>
      {EXPLORE_FILTER_CHIPS.map((chip) => {
        const isActive = activeCategory === chip.category;
        const icon = chipIcon(chip.category);
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => setActiveCategory(chip.category)}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-colors md:py-2 ${
              isActive
                ? 'bg-primary text-white'
                : 'glass border border-white/40 text-secondary hover:bg-white md:bg-surface-container-high md:text-on-surface-variant md:hover:bg-secondary-container'
            }`}
          >
            {icon ? <MaterialIcon name={icon} size={16} /> : null}
            {chip.label}
          </button>
        );
      })}
    </div>
  );

  const searchBar = (className = '') => (
    <div className={`relative ${className}`}>
      <MaterialIcon
        name="search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
      />
      <input
        className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-10 pr-4 font-body-lg text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 md:rounded-lg"
        placeholder="Search chilled spots..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );

  return (
    <div className="relative min-h-screen pb-32 md:pb-0" data-page="explore">
      <AppMobileHeader />
      <AppTopNav active="explore" />

      <main className="relative h-screen w-full overflow-hidden pt-16">
        <div className="absolute inset-0">{mapContent}</div>

        {/* Mobile: floating search + chips */}
        <div className="absolute left-0 top-20 z-20 w-full px-margin-mobile md:hidden">
          <div className="glass flex items-center rounded-xl border border-white/50 px-4 py-3 shadow-md">
            <MaterialIcon name="search" className="text-outline" />
            <input
              className="ml-2 w-full border-none bg-transparent font-body-lg focus:ring-0"
              placeholder="Find a cool spot..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <MaterialIcon name="mic" className="text-primary" />
          </div>
          <div className="mt-4">{filterChips}</div>
        </div>

        {/* Desktop: left sidebar */}
        <div className="pointer-events-none absolute left-10 top-8 z-30 hidden max-h-[calc(100vh-120px)] w-96 flex-col gap-4 md:flex">
          <div className="glass-panel pointer-events-auto rounded-xl border border-white/40 p-4 shadow-xl">
            {searchBar('mb-4')}
            {filterChips}
          </div>
          <div className="glass-panel pointer-events-auto flex flex-1 flex-col overflow-hidden rounded-xl border border-white/40 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <h2 className="font-title-md text-on-surface">Nearby Cool Spots</h2>
              <span className="rounded bg-primary-container px-2 py-0.5 text-xs font-bold text-primary">
                {places.length} Results
              </span>
            </div>
            <div className="hide-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
              {places.map((place) => (
                <NearbyListItem
                  key={place.id}
                  place={place}
                  isSelected={place.slug === selectedSlug}
                  onSelect={() => setSelectedSlug(place.slug)}
                />
              ))}
              {places.length === 0 ? (
                <p className="p-4 text-center text-sm text-on-surface-variant">
                  No cool spots found nearby.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile: bottom preview card */}
        {selected ? (
          <div className="absolute bottom-28 left-0 z-20 w-full px-margin-mobile md:hidden">
            <ExplorePreviewCard place={selected} variant="mobile" />
          </div>
        ) : null}

        {/* Desktop: right detail card */}
        {selected ? (
          <div className="pointer-events-none absolute bottom-8 right-10 z-40 hidden w-[420px] md:block">
            <ExplorePreviewCard place={selected} variant="desktop" />
          </div>
        ) : null}

        {/* Desktop: map controls */}
        <div className="absolute bottom-8 left-1/2 z-40 hidden -translate-x-1/2 md:flex">
          <div className="glass-panel flex items-center gap-4 rounded-full border border-white/40 px-6 py-3 shadow-xl">
            <button
              type="button"
              onClick={recenter}
              className="group flex flex-col items-center gap-1"
              aria-label="My location"
            >
              <MaterialIcon
                name="my_location"
                className="text-on-surface-variant group-hover:text-primary"
              />
              <span className="text-[10px] font-bold uppercase text-outline-variant">Me</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30" />
            <div className="flex items-center gap-6">
              <button type="button" onClick={zoomOut} aria-label="Zoom out">
                <MaterialIcon name="remove" className="text-on-surface-variant hover:text-primary" />
              </button>
              <span className="min-w-[40px] text-center text-sm font-bold text-on-surface">
                {Math.round((viewState.zoom / 13) * 100)}%
              </span>
              <button type="button" onClick={zoomIn} aria-label="Zoom in">
                <MaterialIcon name="add" className="text-on-surface-variant hover:text-primary" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <AppBottomNav active="explore" />
    </div>
  );
}
