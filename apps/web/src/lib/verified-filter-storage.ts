export const VERIFIED_ONLY_STORAGE_KEY = 'freshy-verified-only';
export const VERIFIED_ONLY_CHANGE_EVENT = 'freshy-verified-only-change';

/** First visit and missing storage: show verified places only. */
export const DEFAULT_VERIFIED_ONLY = true;

function localStorageRef(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }
  return null;
}

export function readVerifiedOnlyFilter(): boolean {
  const storage = localStorageRef();
  if (!storage) return DEFAULT_VERIFIED_ONLY;
  try {
    const raw = storage.getItem(VERIFIED_ONLY_STORAGE_KEY);
    if (raw === null) return DEFAULT_VERIFIED_ONLY;
    return raw === 'true';
  } catch {
    return DEFAULT_VERIFIED_ONLY;
  }
}

export function writeVerifiedOnlyFilter(value: boolean): void {
  const storage = localStorageRef();
  if (!storage) return;
  try {
    storage.setItem(VERIFIED_ONLY_STORAGE_KEY, value ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(VERIFIED_ONLY_CHANGE_EVENT, { detail: value }));
    }
  } catch {
    // Ignore quota or privacy mode errors.
  }
}
