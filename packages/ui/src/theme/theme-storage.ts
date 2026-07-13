import type { ThemeId } from '@freshy/theme/tokens';
import { CORNER_STYLE } from '@freshy/config/corner-style';

export type ThemePreference = ThemeId | 'system';
export type ResolvedThemeId = ThemeId;

export const THEME_STORAGE_KEY = 'freshy-theme';
export const THEME_CHANGE_EVENT = 'freshy-theme-change';
export const NATIVE_COLOR_SCHEME_EVENT = 'freshy-native-color-scheme';

export type NativeColorScheme = 'light' | 'dark';

declare global {
  interface Window {
    __FRESHY_NATIVE_COLOR_SCHEME__?: NativeColorScheme;
  }
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'default' || value === 'dark' || value === 'system';
}

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // Ignore quota or privacy mode errors.
  }
  return 'system';
}

export function writeThemePreference(value: ThemePreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: value }));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function readNativeColorScheme(): NativeColorScheme | null {
  if (typeof window === 'undefined') return null;
  const scheme = window.__FRESHY_NATIVE_COLOR_SCHEME__;
  if (scheme === 'light' || scheme === 'dark') return scheme;
  return null;
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  const native = readNativeColorScheme();
  if (native === 'dark') return true;
  if (native === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveThemeId(
  preference: ThemePreference,
  prefersDark = systemPrefersDark(),
): ResolvedThemeId {
  if (preference === 'dark') return 'dark';
  if (preference === 'default') return 'default';
  return prefersDark ? 'dark' : 'default';
}

export function themePreferenceLabel(preference: ThemePreference): string {
  if (preference === 'default') return 'Light';
  if (preference === 'dark') return 'Dark';
  return 'System';
}

/** Inline script to set data-theme and data-corners before first paint and avoid a flash. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{document.documentElement.dataset.corners='${CORNER_STYLE}';var n=window.__FRESHY_NATIVE_COLOR_SCHEME__;var dark=n==='dark'||(n!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var p=localStorage.getItem('${THEME_STORAGE_KEY}');var theme=p==='dark'||(p!=='default'&&(!p||p==='system')&&dark)?'dark':'default';document.documentElement.dataset.theme=theme;}catch(e){}})();`;

export function buildNativeThemeBridgeScript(scheme: NativeColorScheme): string {
  const prefersDark = scheme === 'dark';
  return `(function(){try{document.documentElement.dataset.corners='${CORNER_STYLE}';window.__FRESHY_NATIVE_COLOR_SCHEME__='${scheme}';window.dispatchEvent(new CustomEvent('${NATIVE_COLOR_SCHEME_EVENT}',{detail:'${scheme}'}));var dark=${prefersDark};var p=localStorage.getItem('${THEME_STORAGE_KEY}');var theme=p==='dark'||(p!=='default'&&(!p||p==='system')&&dark)?'dark':'default';document.documentElement.dataset.theme=theme;}catch(e){}})();true;`;
}
