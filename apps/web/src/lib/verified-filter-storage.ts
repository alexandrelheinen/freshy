export const VERIFIED_ONLY_STORAGE_KEY = 'freshy-verified-only';
export const VERIFIED_ONLY_CHANGE_EVENT = 'freshy-verified-only-change';

export function readVerifiedOnlyFilter(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(VERIFIED_ONLY_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeVerifiedOnlyFilter(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VERIFIED_ONLY_STORAGE_KEY, value ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(VERIFIED_ONLY_CHANGE_EVENT, { detail: value }));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}
