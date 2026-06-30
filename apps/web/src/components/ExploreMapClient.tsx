'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import Link from 'next/link';
import {
  FRESHNESS_LEVEL_LABELS,
  FreshnessBar,
  EXPLORE_FILTER_CHIPS,
  GlassCard,
  MAP_SEARCH,
  MaterialIcon,
  getPlacePhotoUrl,
  PLACE_CATEGORY_ICONS,
  PLACE_CATEGORY_LABELS,
  PLACE_TAG_LABELS,
  ROUTES,
  filterValidPlaceTags,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import {
  freshnessBarState,
  directionsUrl,
  formatDistance,
  formatDistanceWithWalk,
} from '../lib/api';
import { mapStyleUrl, type MapStyleId } from '../lib/map-styles';
import { cappedSearchRadiusKm, formatSearchRadiusKm } from '../lib/map-zoom';
import { locationStatusMessage } from '../lib/location-messages';
import { useUserLocation } from '../lib/use-user-location';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceMapMarker, UserLocationMarker, freshnessLabel } from './map-markers';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

type MapSearchAnchor = { latitude: number; longitude: number; zoom: number };

function mapViewDiffersFromSearch(view: MapSearchAnchor, search: MapSearchAnchor): boolean {
  return (
    Math.abs(view.latitude - search.latitude) > 0.0005 ||
    Math.abs(view.longitude - search.longitude) > 0.0005 ||
    Math.abs(view.zoom - search.zoom) > 0.1
  );
}

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
  const freshness = freshnessBarState(place.aggregatedFreshnessLevel);

  if (variant === 'desktop') {
    const validTags = filterValidPlaceTags(place.tags ?? []);
    const freshnessLabelClass =
      freshness.tone === 'green'
        ? 'text-success'
        : freshness.tone === 'blue'
          ? 'text-primary'
          : 'text-on-surface-variant';

    return (
      <div className="glass-panel pointer-events-auto overflow-hidden rounded-2xl border border-glass-border shadow-2xl">
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-container/40 to-secondary-container/30">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="p-6">
          <h1 className="font-headline-lg font-bold text-on-surface">{place.name}</h1>
          {place.address ? (
            <p className="mt-1 flex items-center gap-1 text-on-surface-variant">
              <MaterialIcon name="location_on" size={16} />
              {place.address}
            </p>
          ) : null}
          <p className="mt-2 flex flex-wrap gap-1.5 text-sm text-on-surface-variant">
            {validTags.length > 0
              ? validTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-medium text-on-secondary-container"
                  >
                    {PLACE_TAG_LABELS[tag]}
                  </span>
                ))
              : '—'}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {place.aggregatedFreshnessLevel ? (
              <span className={`text-sm font-bold ${freshnessLabelClass}`}>
                {FRESHNESS_LEVEL_LABELS[place.aggregatedFreshnessLevel]}
              </span>
            ) : (
              <span className="text-sm font-bold text-on-surface-variant">—</span>
            )}
            <div className="flex flex-1">
              <FreshnessBar segments={freshness.segments} tone={freshness.tone} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <a
              href={directionsUrl({
                latitude: place.latitude,
                longitude: place.longitude,
                address: place.address,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <MaterialIcon name="directions" />
              Get Directions
            </a>
            <Link
              href={ROUTES.place(place.slug)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-container py-3 font-bold text-on-secondary-container transition-colors hover:bg-secondary-container/80"
            >
              <MaterialIcon name="menu_book" />
              Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={ROUTES.place(place.slug)}>
      <GlassCard className="flex items-center gap-4 rounded-2xl border border-glass-border p-4 shadow-2xl transition hover:shadow-md">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-container/50 to-secondary-container/40">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-headline-lg-mobile leading-tight text-on-surface">
                {place.name}
              </h2>
              <p className="flex items-center gap-1 font-body-sm text-secondary">
                <MaterialIcon name="location_on" size={14} />
                {place.distanceKm != null ? formatDistanceWithWalk(place.distanceKm) : 'Nearby'}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-primary">
                {freshnessLabel(place.aggregatedFreshnessLevel)} FRESHNESS
              </span>
              <FreshnessBar segments={freshness.segments} tone={freshness.tone} />
            </div>
            <div className="rounded bg-secondary-container px-2 py-1 text-[9px] font-bold uppercase text-on-secondary-container">
              {filterValidPlaceTags(place.tags ?? [])
                .slice(0, 1)
                .map((tag) => PLACE_TAG_LABELS[tag])
                .join('') ||
                PLACE_CATEGORY_LABELS[place.category as PlaceCategory] ||
                place.category}
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
  const freshness = freshnessBarState(place.aggregatedFreshnessLevel);

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
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary-container/40 to-secondary-container/30">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-on-surface">{place.name}</h3>
          </div>
          {place.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">{place.description}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            {place.aggregatedFreshnessLevel ? (
              <div className="w-16">
                <FreshnessBar segments={freshness.segments} tone={freshness.tone} />
              </div>
            ) : null}
            {place.distanceKm != null ? (
              <span className="text-[10px] text-outline">
                • {formatDistance(place.distanceKm)} away
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ExploreMapClient({ initialPlaces }: { initialPlaces: PlaceDto[] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialPlaces[0]?.slug ?? null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | undefined>();
  const {
    location: userLocation,
    denied: locationDenied,
    locationError,
    requestLocation,
    mapCenter,
    mapZoom,
    setMapCenter,
    zoomForSearchRadius,
  } = useUserLocation();
  const [viewState, setViewState] = useState<MapSearchAnchor>(() => ({
    latitude: mapCenter.lat,
    longitude: mapCenter.lng,
    zoom: mapZoom,
  }));
  const [searchAnchor, setSearchAnchor] = useState<MapSearchAnchor>(() => ({
    latitude: mapCenter.lat,
    longitude: mapCenter.lng,
    zoom: mapZoom,
  }));
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('streets');

  const activeSearchRadiusKm = useMemo(
    () =>
      cappedSearchRadiusKm(
        searchAnchor.latitude,
        searchAnchor.zoom,
        MAP_SEARCH.maxRadiusKm,
        MAP_SEARCH.minRadiusKm,
      ),
    [searchAnchor],
  );

  const needsResearch = mapViewDiffersFromSearch(viewState, searchAnchor);

  const selected = useMemo(
    () => places.find((p) => p.slug === selectedSlug) ?? places[0],
    [places, selectedSlug],
  );

  const loadPlaces = useCallback(
    async (opts: { lat: number; lng: number; zoom: number; category?: string; q?: string }) => {
      const radius = cappedSearchRadiusKm(
        opts.lat,
        opts.zoom,
        MAP_SEARCH.maxRadiusKm,
        MAP_SEARCH.minRadiusKm,
      );
      const params = new URLSearchParams();
      params.set('lat', String(opts.lat));
      params.set('lng', String(opts.lng));
      params.set('radius', String(radius));
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
    [selectedSlug],
  );

  const runSearch = useCallback(
    (anchor: MapSearchAnchor) => {
      setSearchAnchor(anchor);
      setMapCenter({ lat: anchor.latitude, lng: anchor.longitude }, anchor.zoom);
      void loadPlaces({
        lat: anchor.latitude,
        lng: anchor.longitude,
        zoom: anchor.zoom,
        category: activeCategory,
        q: query || undefined,
      });
    },
    [activeCategory, loadPlaces, query, setMapCenter],
  );

  const skipFilterReload = useRef(true);

  useEffect(() => {
    runSearch(searchAnchor);
    // Initial load for the stored or pilot map center.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipFilterReload.current) {
      skipFilterReload.current = false;
      return;
    }
    void loadPlaces({
      lat: searchAnchor.latitude,
      lng: searchAnchor.longitude,
      zoom: searchAnchor.zoom,
      category: activeCategory,
      q: query || undefined,
    });
  }, [activeCategory, loadPlaces, query, searchAnchor]);

  const zoomIn = () => setViewState((v) => ({ ...v, zoom: Math.min(v.zoom + 1, 18) }));
  const zoomOut = () => setViewState((v) => ({ ...v, zoom: Math.max(v.zoom - 1, 2) }));
  const researchHere = () => runSearch(viewState);
  const recenter = () => {
    if (userLocation) {
      const zoom = zoomForSearchRadius(userLocation.lat);
      const anchor = { latitude: userLocation.lat, longitude: userLocation.lng, zoom };
      setViewState(anchor);
      runSearch(anchor);
    } else {
      requestLocation();
    }
  };
  const toggleMapStyle = () => setMapStyleId((id) => (id === 'streets' ? 'satellite' : 'streets'));

  const handleMapMoveEnd = useCallback(
    (latitude: number, longitude: number, zoom: number) => {
      setMapCenter({ lat: latitude, lng: longitude }, zoom);
    },
    [setMapCenter],
  );

  const mapContent = MAPBOX_TOKEN ? (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onMoveEnd={(evt) =>
        handleMapMoveEnd(evt.viewState.latitude, evt.viewState.longitude, evt.viewState.zoom)
      }
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyleUrl(mapStyleId)}
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
            ? 'bg-primary text-on-primary'
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
                ? 'bg-primary text-on-primary'
                : 'glass border border-glass-border text-secondary hover:bg-glass-surface md:bg-surface-container-high md:text-on-surface-variant md:hover:bg-secondary-container'
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

  const exploreLocationMessage =
    locationDenied || locationError
      ? locationStatusMessage({
          permissionDenied: locationDenied,
          locationError,
          searchRadiusKm: activeSearchRadiusKm,
          usingGps: userLocation != null,
        })
      : null;

  return (
    <div className="relative min-h-screen pb-mobile-nav md:pb-0" data-page="explore">
      <AppMobileHeader />
      <AppTopNav active="explore" />

      <main className="relative h-screen w-full overflow-hidden pt-16">
        <div className="absolute inset-0">{mapContent}</div>

        <button
          type="button"
          onClick={researchHere}
          disabled={!needsResearch}
          className={`absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full px-6 py-2.5 font-label-caps shadow-lg transition-all md:top-[4.5rem] ${
            needsResearch
              ? 'bg-primary text-on-primary hover:brightness-110 active:scale-[0.98]'
              : 'pointer-events-none bg-surface-container-high/60 text-on-surface-variant/50'
          }`}
        >
          Research here
        </button>

        {exploreLocationMessage ? (
          <div className="absolute bottom-28 left-4 right-4 z-30 mx-auto max-w-md rounded-xl border border-outline-variant/30 bg-surface/95 p-4 text-center shadow-lg backdrop-blur md:bottom-8 md:left-10 md:right-auto">
            <p className="font-body-sm text-on-surface-variant">{exploreLocationMessage}</p>
            <p className="mt-2 font-body-sm text-on-surface-variant">
              You can also pan the map to search another area.
            </p>
            <button
              type="button"
              onClick={requestLocation}
              className="mt-3 rounded-lg bg-primary px-4 py-2 font-label-caps text-on-primary"
            >
              Use my location
            </button>
          </div>
        ) : null}

        {/* Mobile: floating search + chips */}
        <div className="absolute left-0 top-20 z-20 w-full px-margin-mobile md:hidden">
          <div className="glass flex items-center rounded-xl border border-glass-border px-4 py-3 shadow-md">
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
          <div className="glass-panel pointer-events-auto rounded-xl border border-glass-border p-4 shadow-xl">
            {searchBar('mb-4')}
            {filterChips}
          </div>
          <div className="glass-panel pointer-events-auto flex flex-1 flex-col overflow-hidden rounded-xl border border-glass-border shadow-xl">
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

        {/* Mobile: bottom overlay stack (FABs above preview card, both above bottom nav) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-end gap-3 px-margin-mobile inset-pb-mobile-nav md:hidden">
          <div className="pointer-events-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleMapStyle}
              className="glass flex h-12 w-12 items-center justify-center rounded-full border border-glass-border shadow-lg transition-transform active:scale-95"
              aria-label={
                mapStyleId === 'streets' ? 'Switch to satellite view' : 'Switch to map view'
              }
            >
              <MaterialIcon
                name={mapStyleId === 'streets' ? 'satellite_alt' : 'map'}
                className="text-primary"
              />
            </button>
            <button
              type="button"
              onClick={recenter}
              className="glass flex h-12 w-12 items-center justify-center rounded-full border border-glass-border shadow-lg transition-transform active:scale-95"
              aria-label="My location"
            >
              <MaterialIcon name="my_location" className="text-primary" />
            </button>
          </div>
          {selected ? (
            <div className="pointer-events-auto w-full">
              <ExplorePreviewCard place={selected} variant="mobile" />
            </div>
          ) : null}
        </div>

        {/* Desktop: right detail card */}
        {selected ? (
          <div className="pointer-events-none absolute bottom-8 right-10 z-40 hidden w-[420px] md:block">
            <ExplorePreviewCard place={selected} variant="desktop" />
          </div>
        ) : null}

        {/* Desktop: map controls (left of detail card on md-lg; centered on xl+) */}
        <div className="absolute bottom-8 left-[27.5rem] z-40 hidden md:flex xl:left-1/2 xl:-translate-x-1/2">
          <div className="glass-panel flex items-center gap-4 rounded-full border border-glass-border px-6 py-3 shadow-xl">
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
            <button
              type="button"
              onClick={toggleMapStyle}
              className="group flex flex-col items-center gap-1"
              aria-label={
                mapStyleId === 'streets' ? 'Switch to satellite view' : 'Switch to map view'
              }
            >
              <MaterialIcon
                name={mapStyleId === 'streets' ? 'satellite_alt' : 'map'}
                className="text-on-surface-variant group-hover:text-primary"
              />
              <span className="text-[10px] font-bold uppercase text-outline-variant">
                {mapStyleId === 'streets' ? 'Satellite' : 'Map'}
              </span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30" />
            <div className="flex items-center gap-6">
              <button type="button" onClick={zoomOut} aria-label="Zoom out">
                <MaterialIcon
                  name="remove"
                  className="text-on-surface-variant hover:text-primary"
                />
              </button>
              <span className="min-w-[40px] text-center text-sm font-bold text-on-surface">
                {Math.round((viewState.zoom / zoomForSearchRadius(viewState.latitude)) * 100)}%
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
