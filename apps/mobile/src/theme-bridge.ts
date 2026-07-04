import type { NativeColorScheme } from '@freshy/ui';

export function resolveNativeColorScheme(
  colorScheme: string | null | undefined,
): NativeColorScheme {
  return colorScheme === 'dark' ? 'dark' : 'light';
}
