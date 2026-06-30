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

export function AcStrengthBar({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex h-1.5 w-full gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${i <= level ? 'bg-primary' : 'bg-outline-variant/40'}`}
        />
      ))}
    </div>
  );
}

/** Five snowflake icons used on place detail (Stitch detalhes_do_local). */
export function AcStrengthSnowflakes({ level }: { level: 1 | 2 | 3 }) {
  const filled = level === 3 ? 5 : level === 2 ? 3 : 1;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialIcon
          key={i}
          name="ac_unit"
          size={24}
          filled={i <= filled}
          className={i <= filled ? 'text-primary' : 'text-outline-variant/50'}
        />
      ))}
    </div>
  );
}

export * from './tokens';
