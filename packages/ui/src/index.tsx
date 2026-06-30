import type { ReactNode } from 'react';
import { MaterialIcon } from './icons';

export { MaterialIcon } from './icons';
export type { MaterialIconName } from './icons';

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/40 bg-white/80 shadow-sm backdrop-blur-[15px] ${className}`}
    >
      {children}
    </div>
  );
}

export function FreshnessBar({
  segments,
  tone = 'blue',
}: {
  segments: number;
  tone?: 'neutral' | 'blue' | 'green';
}) {
  const activeClass =
    tone === 'green' ? 'bg-emerald-600' : tone === 'blue' ? 'bg-primary' : 'bg-outline-variant/60';
  return (
    <div className="flex h-1.5 w-full gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${i <= segments ? activeClass : 'bg-outline-variant/40'}`}
        />
      ))}
    </div>
  );
}

/** @deprecated Use FreshnessBar */
export function AcStrengthBar({ level }: { level: 1 | 2 | 3 }) {
  return <FreshnessBar segments={level} tone="blue" />;
}

/** Five snowflake icons used on place detail (Stitch detalhes_do_local). */
export function FreshnessSnowflakes({
  segments,
  tone = 'blue',
}: {
  segments: number;
  tone?: 'neutral' | 'blue' | 'green';
}) {
  const filled = segments >= 3 ? 5 : segments === 2 ? 3 : segments === 1 ? 1 : 0;
  const activeClass =
    tone === 'green'
      ? 'text-emerald-600'
      : tone === 'blue'
        ? 'text-primary'
        : 'text-outline-variant/70';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialIcon
          key={i}
          name={tone === 'green' ? 'nature' : 'ac_unit'}
          size={24}
          filled={i <= filled}
          className={i <= filled ? activeClass : 'text-outline-variant/50'}
        />
      ))}
    </div>
  );
}

/** @deprecated Use FreshnessSnowflakes */
export function AcStrengthSnowflakes({ level }: { level: 1 | 2 | 3 }) {
  return <FreshnessSnowflakes segments={level} tone="blue" />;
}

export * from './tokens';
