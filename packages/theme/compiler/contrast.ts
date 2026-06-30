/** WCAG 2.1 contrast helpers for theme token validation. */

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim();
  if (!normalized.startsWith('#')) {
    return null;
  }

  const raw = normalized.slice(1);
  if (raw.length === 3) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16),
    };
  }

  if (raw.length === 6) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }

  return null;
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) {
    return null;
  }

  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function onColorPairs(colors: Record<string, string>): Array<[string, string, string]> {
  return Object.keys(colors)
    .filter((key) => key.startsWith('on-'))
    .map((onKey) => {
      const baseKey = onKey.slice(3);
      return [onKey, baseKey, colors[baseKey]] as [string, string, string];
    })
    .filter(([, , baseValue]) => Boolean(baseValue));
}

export function assertContrastPairs(colors: Record<string, string>, minimumRatio = 4.5): string[] {
  const failures: string[] = [];

  for (const [onKey, baseKey, baseValue] of onColorPairs(colors)) {
    const ratio = contrastRatio(colors[onKey], baseValue);
    if (ratio === null) {
      continue;
    }
    if (ratio < minimumRatio) {
      failures.push(`${onKey} on ${baseKey}: ${ratio.toFixed(2)}:1 (min ${minimumRatio}:1)`);
    }
  }

  return failures;
}
