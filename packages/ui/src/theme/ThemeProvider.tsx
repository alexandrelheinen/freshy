'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getThemeTokens, type ThemeId } from '@freshy/theme/tokens';
import {
  readThemePreference,
  readNativeColorScheme,
  resolveThemeId,
  systemPrefersDark,
  writeThemePreference,
  NATIVE_COLOR_SCHEME_EVENT,
  type ResolvedThemeId,
  type ThemePreference,
} from './theme-storage';
import { CORNER_STYLE } from '@freshy/config/corner-style';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedThemeId;
  setTheme: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyResolvedTheme(themeId: ResolvedThemeId): void {
  document.documentElement.dataset.theme = themeId;
  document.documentElement.dataset.corners = CORNER_STYLE;
  const themeColor = getThemeTokens(themeId).colors.primary;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', themeColor);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => readThemePreference());
  const [prefersDark, setPrefersDark] = useState(() => systemPrefersDark());

  const resolvedTheme = useMemo(
    () => resolveThemeId(preference, prefersDark),
    [preference, prefersDark],
  );

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (readNativeColorScheme() !== null) return;
      setPrefersDark(event.matches);
    };
    const onNativeScheme = (event: Event) => {
      const scheme = (event as CustomEvent<'light' | 'dark'>).detail;
      setPrefersDark(scheme === 'dark');
    };
    media.addEventListener('change', onMediaChange);
    window.addEventListener(NATIVE_COLOR_SCHEME_EVENT, onNativeScheme);
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener(NATIVE_COLOR_SCHEME_EVENT, onNativeScheme);
    };
  }, []);

  const setTheme = useCallback((nextPreference: ThemePreference) => {
    writeThemePreference(nextPreference);
    setPreference(nextPreference);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setTheme,
    }),
    [preference, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useResolvedThemeId(): ThemeId {
  return useTheme().resolvedTheme;
}
