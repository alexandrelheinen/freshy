'use client';

import Link from 'next/link';
import { BRAND_ICON, MaterialIcon, NAV_ICONS, NAV_ITEMS, type MaterialIconName } from '@freshy/ui';

export function AppBottomNav({
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
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1 text-label-caps transition-transform active:scale-90 ${
              isActive ? 'bg-primary-container text-on-primary-container' : 'text-secondary'
            }`}
          >
            <MaterialIcon name={iconName} filled={isActive} size={22} />
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppTopNav({
  active = 'explore',
}: {
  active?: 'explore' | 'saved' | 'cooling' | 'profile';
}) {
  const desktopItems = NAV_ITEMS.filter((item) => item.id !== 'profile');

  return (
    <header className="fixed top-0 z-50 hidden h-16 w-full items-center justify-between bg-surface/80 px-10 shadow-sm backdrop-blur-md md:flex">
      <Link href="/explore" className="flex items-center gap-2">
        <MaterialIcon name={BRAND_ICON} className="text-primary" size={32} />
        <span className="font-display-lg text-primary">Freshy</span>
      </Link>

      <nav className="flex items-center gap-8">
        {desktopItems.map((item) => {
          const isActive = active === item.id;
          const iconName = NAV_ICONS[item.id] as MaterialIconName;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex flex-col items-center font-label-caps transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <MaterialIcon
                name={iconName}
                filled={isActive}
                size={22}
                className="mb-0.5 transition-transform group-hover:scale-110"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high transition-colors hover:bg-primary/10"
          aria-label="Notifications"
        >
          <MaterialIcon name="notifications" className="text-on-surface-variant" />
        </button>
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-primary-container/30"
          aria-label="Profile"
        >
          <MaterialIcon name="digital_wellbeing" className="text-primary" />
        </Link>
      </div>
    </header>
  );
}

export function AppMobileHeader({
  title,
  backHref,
  showBrand = true,
}: {
  title?: string;
  backHref?: string;
  showBrand?: boolean;
}) {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95"
            aria-label="Go back"
          >
            <MaterialIcon name="arrow_back" />
          </Link>
        ) : null}
        {showBrand && !backHref ? (
          <>
            <MaterialIcon name={BRAND_ICON} className="text-primary" size={28} />
            <h1 className="font-display-lg text-2xl tracking-tight text-primary">Freshy</h1>
          </>
        ) : title ? (
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary">
            {title}
          </h1>
        ) : null}
      </div>
      <Link
        href="/profile"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-primary-container/30"
        aria-label="Profile"
      >
        <MaterialIcon name="digital_wellbeing" className="text-primary" />
      </Link>
    </header>
  );
}
