import type { ReactNode } from 'react';
import { MaterialIcon, type MaterialIconName } from './icons';
import { NAV_ICONS, NAV_ITEMS } from './tokens';

export { MaterialIcon } from './icons';
export type { MaterialIconName } from './icons';

export function TopAppBar({
  title = 'Freshy',
  showAvatar = false,
  avatarSlot,
  backHref,
}: {
  title?: string;
  showAvatar?: boolean;
  avatarSlot?: ReactNode;
  backHref?: string;
}) {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md md:px-10">
      <div className="flex items-center gap-2">
        {backHref ? (
          <a
            href={backHref}
            className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95"
            aria-label="Go back"
          >
            <MaterialIcon name="arrow_back" />
          </a>
        ) : null}
        {!backHref ? (
          <>
            <MaterialIcon name="ac_unit" className="text-primary" size={28} />
            <h1 className="font-display-lg text-2xl tracking-tight text-primary">{title}</h1>
          </>
        ) : (
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary">
            {title}
          </h1>
        )}
      </div>
      {showAvatar && avatarSlot ? (
        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-container">
          {avatarSlot}
        </div>
      ) : null}
    </header>
  );
}

export function BottomNavBar({
  active = 'explore',
}: {
  active?: 'explore' | 'saved' | 'cooling' | 'profile';
}) {
  return (
    <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-outline-variant/20 bg-surface/90 px-4 pb-6 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-lg md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        const iconName = NAV_ICONS[item.id] as MaterialIconName;
        return (
          <a
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1 text-label-caps transition-transform active:scale-90 ${
              isActive ? 'bg-primary-container text-on-primary-container' : 'text-secondary'
            }`}
          >
            <MaterialIcon name={iconName} filled={isActive} size={22} />
            <span className="mt-0.5">{item.label}</span>
          </a>
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
