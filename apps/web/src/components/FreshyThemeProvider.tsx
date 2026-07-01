'use client';

import { ThemeProvider } from '@freshy/ui';

export function FreshyThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
