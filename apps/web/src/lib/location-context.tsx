'use client';

import { PILOT_CITY } from '@freshy/ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  readStoredMapCenter,
  readStoredUserGps,
  writeStoredMapCenter,
  writeStoredUserGps,
} from './location-storage';
import { zoomForRadiusKm } from './map-zoom';

export type UserCoords = { lat: number; lng: number };
export type LocationErrorCode = 'unavailable' | 'timeout' | null;

type MapView = UserCoords & { zoom: number };

type LocationContextValue = {
  location: UserCoords | null;
  mapCenter: UserCoords;
  searchCenter: UserCoords;
  searchRadiusKm: number;
  mapZoom: number;
  denied: boolean;
  locationError: LocationErrorCode;
  loading: boolean;
  usingGps: boolean;
  requestLocation: () => void;
  setMapCenter: (center: UserCoords, zoom?: number) => void;
  zoomForSearchRadius: (latitude?: number) => number;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function pilotMapView(): MapView {
  const zoom = zoomForRadiusKm(PILOT_CITY.latitude, PILOT_CITY.defaultRadiusKm);
  return { lat: PILOT_CITY.latitude, lng: PILOT_CITY.longitude, zoom };
}

function initialMapView(): MapView {
  const stored = readStoredMapCenter();
  if (stored) {
    return { lat: stored.lat, lng: stored.lng, zoom: stored.zoom };
  }
  return pilotMapView();
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const initial = initialMapView();
  const [location, setLocation] = useState<UserCoords | null>(() => readStoredUserGps());
  const [mapCenter, setMapCenterState] = useState<UserCoords>({
    lat: initial.lat,
    lng: initial.lng,
  });
  const [mapZoom, setMapZoom] = useState(initial.zoom);
  const [denied, setDenied] = useState(false);
  const [locationError, setLocationError] = useState<LocationErrorCode>(null);
  const [loading, setLoading] = useState(true);

  const searchRadiusKm = PILOT_CITY.defaultRadiusKm;

  const zoomForSearchRadius = useCallback(
    (latitude = mapCenter.lat) => zoomForRadiusKm(latitude, searchRadiusKm),
    [mapCenter.lat, searchRadiusKm],
  );

  const setMapCenter = useCallback((center: UserCoords, zoom?: number) => {
    setMapCenterState(center);
    if (zoom != null) {
      setMapZoom(zoom);
      writeStoredMapCenter({ lat: center.lat, lng: center.lng, zoom });
      return;
    }
    setMapZoom((currentZoom) => {
      writeStoredMapCenter({ lat: center.lat, lng: center.lng, zoom: currentZoom });
      return currentZoom;
    });
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      setLocationError('unavailable');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        writeStoredUserGps(coords);
        setDenied(false);
        setLocationError(null);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setDenied(true);
          setLocationError(null);
          return;
        }
        setDenied(false);
        if (err.code === err.TIMEOUT) {
          setLocationError('timeout');
          return;
        }
        setLocationError('unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const searchCenter = location ?? mapCenter;
  const usingGps = location != null;

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      mapCenter,
      searchCenter,
      searchRadiusKm,
      mapZoom,
      denied,
      locationError,
      loading,
      usingGps,
      requestLocation,
      setMapCenter,
      zoomForSearchRadius,
    }),
    [
      location,
      mapCenter,
      searchCenter,
      searchRadiusKm,
      mapZoom,
      denied,
      locationError,
      loading,
      usingGps,
      requestLocation,
      setMapCenter,
      zoomForSearchRadius,
    ],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
