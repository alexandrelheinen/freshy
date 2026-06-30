export const MAP_CENTER_STORAGE_KEY = 'freshy-map-center';
export const USER_GPS_STORAGE_KEY = 'freshy-user-gps';

export type StoredMapCenter = {
  lat: number;
  lng: number;
  zoom: number;
};

export type StoredUserGps = {
  lat: number;
  lng: number;
};

function sessionStorageRef(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof globalThis.sessionStorage !== 'undefined') {
    return globalThis.sessionStorage;
  }
  return null;
}

export function readStoredMapCenter(): StoredMapCenter | null {
  const storage = sessionStorageRef();
  if (!storage) return null;
  try {
    const raw = storage.getItem(MAP_CENTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredMapCenter>;
    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lng !== 'number' ||
      typeof parsed.zoom !== 'number'
    ) {
      return null;
    }
    return { lat: parsed.lat, lng: parsed.lng, zoom: parsed.zoom };
  } catch {
    return null;
  }
}

export function writeStoredMapCenter(center: StoredMapCenter): void {
  const storage = sessionStorageRef();
  if (!storage) return;
  try {
    storage.setItem(MAP_CENTER_STORAGE_KEY, JSON.stringify(center));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function readStoredUserGps(): StoredUserGps | null {
  const storage = sessionStorageRef();
  if (!storage) return null;
  try {
    const raw = storage.getItem(USER_GPS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredUserGps>;
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') {
      return null;
    }
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

export function writeStoredUserGps(coords: StoredUserGps): void {
  const storage = sessionStorageRef();
  if (!storage) return;
  try {
    storage.setItem(USER_GPS_STORAGE_KEY, JSON.stringify(coords));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}
