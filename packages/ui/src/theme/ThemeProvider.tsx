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
  resolveThemeId,
  systemPrefersDark,
  writeThemePreference,
  type ResolvedThemeId,
  type ThemePreference,
} from './theme-storage';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedThemeId;
  setTheme: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyResolvedTheme(themeId: ResolvedThemeId): void {
  document.documentElement.dataset.theme = themeId;
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
    const handler = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
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
