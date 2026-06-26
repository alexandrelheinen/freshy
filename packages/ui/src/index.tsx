import type { ReactNode } from 'react';

export function TopAppBar({ title = 'Freshy' }: { title?: string }) {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-primary text-xl" aria-hidden>
          ❄
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-primary">{title}</h1>
      </div>
    </header>
  );
}

export function BottomNavBar({
  active = 'explore',
}: {
  active?: 'explore' | 'saved' | 'cooling' | 'profile';
}) {
  const items = [
    { id: 'explore' as const, label: 'Explore' },
    { id: 'saved' as const, label: 'Saved' },
    { id: 'cooling' as const, label: 'Cooling' },
    { id: 'profile' as const, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-outline-variant/20 bg-surface/90 px-4 pb-6 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-lg">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <span
            key={item.id}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide ${
              isActive ? 'bg-primary-container text-on-primary-container' : 'text-secondary'
            }`}
          >
            {item.label}
          </span>
        );
      })}
    </nav>
  );
}

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

export * from './tokens';
