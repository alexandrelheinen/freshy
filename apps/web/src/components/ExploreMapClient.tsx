'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import Link from 'next/link';
import {
  AcStrengthBar,
  AC_STRENGTH_LABELS,
  GlassCard,
  PILOT_CITY,
  PLACE_CATEGORY_LABELS,
  ROUTES,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { acStrengthLevel, formatDistance } from '../lib/api';
import { AppBottomNav } from './AppBottomNav';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const DEFAULT_CENTER = { latitude: PILOT_CITY.latitude, longitude: PILOT_CITY.longitude };

const FILTER_CHIPS: Array<{ label: string; category?: string }> = [
  { label: 'All' },
  { label: 'Cafes', category: 'CAFE' },
  { label: 'Restaurants', category: 'RESTAURANT' },
  { label: 'Libraries', category: 'LIBRARY' },
  { label: 'Malls', category: 'MALL' },
];

function markerColor(strength: PlaceDto['aggregatedAcStrength']): string {
  if (strength === 'FRIGID') return '#0c6780';
  if (strength === 'COMFORTABLE') return '#4f616a';
  return '#87ceeb';
}

export function ExploreMapClient({ initialPlaces }: { initialPlaces: PlaceDto[] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialPlaces[0]?.slug ?? null,
  );
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
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

  const mapContent = MAPBOX_TOKEN ? (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <NavigationControl position="top-right" showCompass={false} />
      {userLocation && (
        <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
          <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md" />
        </Marker>
      )}
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
          <div
            className="h-3 w-3 cursor-pointer rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: markerColor(place.aggregatedAcStrength) }}
          />
        </Marker>
      ))}
    </Map>
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-secondary-container via-surface to-primary-container/30" />
  );

  return (
    <div className="relative min-h-screen pb-32" data-page="explore">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-primary" aria-hidden>
            ❄
          </span>
          <h1 className="text-2xl font-bold text-primary">Freshy</h1>
        </div>
      </header>

      <main className="relative h-screen w-full overflow-hidden pt-16">
        <div className="absolute inset-0">{mapContent}</div>

        <div className="absolute left-0 top-20 z-20 w-full px-margin-mobile">
          <div className="glass flex items-center rounded-xl border border-white/50 px-4 py-3 shadow-md">
            <span className="text-outline">🔍</span>
            <input
              className="ml-2 w-full border-none bg-transparent text-base focus:ring-0"
              placeholder="Find a cool spot..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto py-1">
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeCategory === chip.category && chip.category != null;
              const isAll = chip.category == null && activeCategory == null;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setActiveCategory(chip.category)}
                  className={`shrink-0 rounded-full px-4 py-1 text-sm font-semibold ${
                    isActive || isAll ? 'bg-primary text-white' : 'glass text-secondary'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="absolute bottom-28 left-0 z-20 w-full px-margin-mobile">
            <Link href={ROUTES.place(selected.slug)}>
              <GlassCard className="flex items-center gap-4 p-4 transition hover:shadow-md">
                <div className="h-24 w-24 shrink-0 rounded-xl bg-primary-container/40" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <p className="text-sm text-secondary">
                    {formatDistance(selected.distanceKm)}
                    {selected.distanceKm != null ? ' away' : ''}
                    {selected.category
                      ? ` · ${PLACE_CATEGORY_LABELS[selected.category as keyof typeof PLACE_CATEGORY_LABELS] ?? selected.category}`
                      : ''}
                  </p>
                  <div className="mt-2">
                    <span className="text-[10px] font-bold uppercase text-primary">
                      {selected.aggregatedAcStrength
                        ? AC_STRENGTH_LABELS[selected.aggregatedAcStrength]
                        : 'AC'}{' '}
                      Strength
                    </span>
                    <AcStrengthBar level={acStrengthLevel(selected.aggregatedAcStrength)} />
                  </div>
                </div>
                {selected.aggregatedTemperatureC != null && (
                  <div className="rounded-lg bg-primary-fixed px-2 py-1 text-lg font-bold text-on-primary-fixed">
                    {Math.round(selected.aggregatedTemperatureC)}°C
                  </div>
                )}
              </GlassCard>
            </Link>
          </div>
        )}
      </main>

      <AppBottomNav active="explore" />
    </div>
  );
}
