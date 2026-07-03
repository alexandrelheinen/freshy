'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl';
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
  useResolvedThemeId,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import type { PlaceDto } from '../lib/api';
import { getThemeTokens } from '@freshy/theme/tokens';
import {
  freshnessBarState,
  directionsUrl,
  formatDistance,
  formatDistanceWithWalk,
  isPlaceVerified,
} from '../lib/api';
import { mapStyleUrl, type MapStyleId } from '../lib/map-styles';
import { cappedSearchRadiusKm } from '../lib/map-zoom';
import { circlePolygonGeoJson } from '../lib/map-circle';
import { locationStatusMessage } from '../lib/location-messages';
import { useUserLocation } from '../lib/use-user-location';
import { useVerifiedOnlyFilter } from '../lib/use-verified-only-filter';
import { API_BASE } from '../lib/api-base';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { SearchRadiusControl } from './SearchRadiusControl';
import { PlaceMapMarker, UserLocationMarker, VerifiedBadge, freshnessLabel } from './map-markers';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

function readThemeColor(role: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${role}`).trim();
}

type MapSearchAnchor = { latitude: number; longitude: number; zoom: number };

function mapViewDiffersFromSearch(view: MapSearchAnchor, search: MapSearchAnchor): boolean {
  return (
    Math.abs(view.latitude - search.latitude) > 0.0005 ||
    Math.abs(view.longitude - search.longitude) > 0.0005 ||
    Math.abs(view.zoom - search.zoom) > 0.1
  );
}

function exploreEmptyMessage(category?: PlaceCategory): string {
  if (category) {
    const label = PLACE_CATEGORY_LABELS[category];
    return `No ${label.toLowerCase()} with AC in this area yet. Try expanding your search radius or changing the category.`;
  }
  return 'No AC places in this area yet. Try expanding your search radius or changing the category.';
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
  const verified = isPlaceVerified(place);

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
          {verified ? <VerifiedBadge className="absolute right-0 top-0" size={14} /> : null}
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
  const [placesLoadError, setPlacesLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialPlaces[0]?.slug ?? null);
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
  const { verifiedOnly } = useVerifiedOnlyFilter();
  const resolvedTheme = useResolvedThemeId();
  const searchPulseColor = useMemo(() => {
    const color = readThemeColor('outline-variant');
    return color || getThemeTokens(resolvedTheme).colors['outline-variant'];
  }, [resolvedTheme]);
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
  const [searchPulse, setSearchPulse] = useState<{
    latitude: number;
    longitude: number;
    radiusKm: number;
  } | null>(null);

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

  const displaySearchRadiusKm = useMemo(
    () =>
      cappedSearchRadiusKm(
        viewState.latitude,
        viewState.zoom,
        MAP_SEARCH.maxRadiusKm,
        MAP_SEARCH.minRadiusKm,
      ),
    [viewState.latitude, viewState.zoom],
  );

  const selected = useMemo(
    () => places.find((p) => p.slug === selectedSlug) ?? places[0],
    [places, selectedSlug],
  );

  const loadPlaces = useCallback(
    async (opts: {
      lat: number;
      lng: number;
      zoom: number;
      category?: string;
      verifiedOnly?: boolean;
    }) => {
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
      if (opts.verifiedOnly) params.set('verifiedOnly', 'true');

      const res = await fetch(`${API_BASE}/places?${params.toString()}`);
      if (!res.ok) {
        setPlacesLoadError('Could not load places for this area. Try again in a moment.');
        return;
      }
      setPlacesLoadError(null);
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
      const radiusKm = cappedSearchRadiusKm(
        anchor.latitude,
        anchor.zoom,
        MAP_SEARCH.maxRadiusKm,
        MAP_SEARCH.minRadiusKm,
      );
      setSearchPulse({
        latitude: anchor.latitude,
        longitude: anchor.longitude,
        radiusKm,
      });
      void loadPlaces({
        lat: anchor.latitude,
        lng: anchor.longitude,
        zoom: anchor.zoom,
        category: activeCategory,
        verifiedOnly,
      });
    },
    [activeCategory, loadPlaces, setMapCenter, verifiedOnly],
  );

  useEffect(() => {
    if (!searchPulse) return;
    const timer = window.setTimeout(() => setSearchPulse(null), 1000);
    return () => window.clearTimeout(timer);
  }, [searchPulse]);

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
      verifiedOnly,
    });
  }, [activeCategory, loadPlaces, searchAnchor, verifiedOnly]);

  const decreaseSearchRadius = () =>
    setViewState((v) => {
      const next = { ...v, zoom: Math.min(v.zoom + 1, 18) };
      setMapCenter({ lat: next.latitude, lng: next.longitude }, next.zoom);
      return next;
    });
  const increaseSearchRadius = () =>
    setViewState((v) => {
      const next = { ...v, zoom: Math.max(v.zoom - 1, 2) };
      setMapCenter({ lat: next.latitude, lng: next.longitude }, next.zoom);
      return next;
    });
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
      {searchPulse ? (
        <Source
          id="search-radius-pulse"
          type="geojson"
          data={circlePolygonGeoJson(
            searchPulse.latitude,
            searchPulse.longitude,
            searchPulse.radiusKm,
          )}
        >
          <Layer
            id="search-radius-pulse-fill"
            type="fill"
            paint={{
              'fill-color': searchPulseColor,
              'fill-opacity': 0.18,
            }}
          />
          <Layer
            id="search-radius-pulse-outline"
            type="line"
            paint={{
              'line-color': searchPulseColor,
              'line-opacity': 0.35,
              'line-width': 2,
            }}
          />
        </Source>
      ) : null}
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
        aria-label="All places"
        aria-pressed={activeCategory == null}
        className={`flex shrink-0 items-center justify-center rounded-full p-2.5 shadow-sm transition-colors ${
          activeCategory == null
            ? 'bg-primary text-on-primary'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
        }`}
      >
        <MaterialIcon name="explore" size={20} />
      </button>
      {EXPLORE_FILTER_CHIPS.map((chip) => {
        const isActive = activeCategory === chip.category;
        const icon = chipIcon(chip.category);
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => setActiveCategory(chip.category)}
            aria-label={chip.label}
            aria-pressed={isActive}
            className={`flex shrink-0 items-center justify-center rounded-full p-2.5 shadow-sm transition-colors ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'glass border border-glass-border text-secondary hover:bg-glass-surface md:bg-surface-container-high md:text-on-surface-variant md:hover:bg-secondary-container'
            }`}
          >
            {icon ? <MaterialIcon name={icon} size={20} /> : null}
          </button>
        );
      })}
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
    <div className="relative min-h-screen" data-page="explore">
      <AppMobileHeader active="explore" />
      <AppTopNav active="explore" />

      <main className="relative h-screen w-full overflow-hidden pt-16">
        <div className="absolute inset-0">{mapContent}</div>

        {needsResearch ? (
          <button
            type="button"
            onClick={researchHere}
            className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-primary px-6 py-2.5 font-label-caps text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Research in this area
          </button>
        ) : null}

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

        {/* Mobile: category filter chips */}
        <div className="absolute left-0 top-20 z-40 w-full px-margin-mobile md:hidden">
          {filterChips}
        </div>

        {/* Desktop: left sidebar */}
        <div className="pointer-events-none absolute left-10 top-20 z-40 hidden max-h-[calc(100vh-10rem)] w-96 flex-col gap-4 md:flex">
          <div className="glass-panel pointer-events-auto rounded-xl border border-glass-border p-4 shadow-xl">
            {filterChips}
          </div>
          <div className="glass-panel pointer-events-auto flex flex-1 flex-col overflow-hidden rounded-xl border border-glass-border shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <h2 className="font-title-md text-on-surface">Nearby Places</h2>
              {places.length > 0 ? (
                <span className="rounded bg-primary-container px-2 py-0.5 text-xs font-bold text-primary">
                  {places.length} Results
                </span>
              ) : null}
            </div>
            <div className="hide-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
              {placesLoadError ? (
                <p className="p-4 text-center text-sm text-error">{placesLoadError}</p>
              ) : places.length === 0 ? (
                <p className="p-4 text-center text-sm text-on-surface-variant">
                  {exploreEmptyMessage(activeCategory)}
                </p>
              ) : (
                places.map((place) => (
                  <NearbyListItem
                    key={place.id}
                    place={place}
                    isSelected={place.slug === selectedSlug}
                    onSelect={() => setSelectedSlug(place.slug)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile: bottom overlay stack (FABs above preview card, both above bottom nav) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-end gap-3 px-margin-mobile pb-4 md:hidden">
          <div className="pointer-events-auto flex items-center gap-2">
            <SearchRadiusControl
              radiusKm={displaySearchRadiusKm}
              onDecrease={decreaseSearchRadius}
              onIncrease={increaseSearchRadius}
            />
            <div className="flex flex-col gap-2">
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
          </div>
          {selected ? (
            <div className="pointer-events-auto w-full">
              <ExplorePreviewCard place={selected} variant="mobile" />
            </div>
          ) : null}
        </div>

        {/* Desktop: right detail card */}
        {selected ? (
          <div className="pointer-events-none absolute bottom-8 right-10 z-30 hidden w-[420px] md:block">
            <ExplorePreviewCard place={selected} variant="desktop" />
          </div>
        ) : null}

        {/* Desktop: map controls (left of detail card on md-lg; centered on xl+) */}
        <div className="absolute bottom-8 left-[27.5rem] z-30 hidden md:flex xl:left-1/2 xl:-translate-x-1/2">
          <div className="glass-panel flex items-center gap-4 rounded-full border border-glass-border px-6 py-3 shadow-xl">
            <button
              type="button"
              onClick={recenter}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary"
              aria-label="My location"
            >
              <MaterialIcon name="my_location" />
            </button>
            <div className="h-6 w-px bg-outline-variant/30" />
            <button
              type="button"
              onClick={toggleMapStyle}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary"
              aria-label={
                mapStyleId === 'streets' ? 'Switch to satellite view' : 'Switch to map view'
              }
            >
              <MaterialIcon name={mapStyleId === 'streets' ? 'satellite_alt' : 'map'} />
            </button>
            <div className="h-6 w-px bg-outline-variant/30" />
            <SearchRadiusControl
              radiusKm={displaySearchRadiusKm}
              onDecrease={decreaseSearchRadius}
              onIncrease={increaseSearchRadius}
              variant="panel"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
