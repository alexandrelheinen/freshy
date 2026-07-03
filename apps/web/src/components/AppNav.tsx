'use client';

import { useUser } from '@clerk/clerk-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  BRAND_ICON,
  MaterialIcon,
  NAV_ICONS,
  NAV_ITEMS,
  ROUTES,
  type MaterialIconName,
} from '@freshy/ui';
import { isStudioAdmin } from '../lib/studio-api';
import { useVerifiedOnlyFilter } from '../lib/use-verified-only-filter';

export type NavActiveId = 'explore' | 'saved' | 'cooling' | 'profile' | 'studio';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkAdminFlag({ children }: { children: (isAdmin: boolean) => ReactNode }) {
  const { user } = useUser();
  return <>{children(isStudioAdmin(user?.publicMetadata))}</>;
}

const MAIN_NAV_ITEMS = NAV_ITEMS.filter((item) => item.id !== 'profile' && item.id !== 'saved');

function ThemePlaceholder() {
  return (
    <button
      type="button"
      disabled
      className="flex h-10 items-center gap-2 rounded-full bg-surface-container-high px-3 text-on-surface-variant/50 transition-colors"
      aria-label="Theme"
    >
      <MaterialIcon name="routine" className="text-on-surface-variant/50" />
      <span className="hidden font-label-caps sm:inline">Theme</span>
    </button>
  );
}

function VerifiedOnlyToggle({ onToggle }: { onToggle?: () => void }) {
  const { verifiedOnly, setVerifiedOnly } = useVerifiedOnlyFilter();

  return (
    <button
      type="button"
      onClick={() => {
        setVerifiedOnly(!verifiedOnly);
        onToggle?.();
      }}
      aria-pressed={verifiedOnly}
      aria-label={verifiedOnly ? 'Showing verified places only' : 'Show all places including unverified'}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        verifiedOnly
          ? 'bg-primary-container text-primary'
          : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
      }`}
    >
      <MaterialIcon name="verified" filled={verifiedOnly} className="text-current" />
    </button>
  );
}

function ProfileAvatarLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href={ROUTES.profile}
      className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-primary-container/30 ${className}`}
      aria-label="Profile"
    >
      <MaterialIcon name="digital_wellbeing" className="text-primary" />
    </Link>
  );
}

function NavLink({
  href,
  label,
  iconName,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  iconName: MaterialIconName;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-2 font-label-caps transition-colors ${
        isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
      }`}
    >
      <MaterialIcon
        name={iconName}
        filled={isActive}
        size={22}
        className="transition-transform group-hover:scale-110"
      />
      {label}
    </Link>
  );
}

function MobileNavMenu({
  active,
  isAdmin,
  open,
  onClose,
}: {
  active?: NavActiveId;
  isAdmin: boolean;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <nav className="absolute left-0 right-0 top-16 z-40 border-b border-outline-variant/20 bg-surface shadow-lg md:hidden">
      <div className="flex flex-col gap-1 px-margin-mobile py-3">
        {MAIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            href={item.href}
            label={item.label}
            iconName={NAV_ICONS[item.id] as MaterialIconName}
            isActive={active === item.id}
            onClick={onClose}
          />
        ))}
        {isAdmin ? (
          <NavLink
            href={ROUTES.studio}
            label="Studio"
            iconName="dashboard_2_edit"
            isActive={active === 'studio'}
            onClick={onClose}
          />
        ) : null}
        <div className="px-2 py-2">
          <VerifiedOnlyToggle onToggle={onClose} />
        </div>
        <NavLink
          href={ROUTES.profile}
          label="Profile"
          iconName={NAV_ICONS.profile as MaterialIconName}
          isActive={active === 'profile'}
          onClick={onClose}
        />
      </div>
    </nav>
  );
}

/** @deprecated Bottom navigation replaced by the mobile header menu. */
export function AppBottomNav(_props: { active?: NavActiveId }) {
  return null;
}

export function AppTopNav({ active = 'explore' }: { active?: NavActiveId }) {
  const studioLink = (isAdmin: boolean) =>
    isAdmin ? (
      <NavLink
        href={ROUTES.studio}
        label="Studio"
        iconName="dashboard_2_edit"
        isActive={active === 'studio'}
      />
    ) : null;

  return (
    <header className="fixed top-0 z-50 hidden h-16 w-full items-center justify-between bg-surface px-10 shadow-sm md:flex">
      <div className="flex items-center gap-10">
        <Link href={ROUTES.explore} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center">
            <MaterialIcon name={BRAND_ICON} className="text-primary" size={40} />
          </div>
          <span className="font-display-lg text-3xl text-primary">Freshy</span>
        </Link>

        <nav className="flex items-center gap-8">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              href={item.href}
              label={item.label}
              iconName={NAV_ICONS[item.id] as MaterialIconName}
              isActive={active === item.id}
            />
          ))}
          {clerkEnabled ? <ClerkAdminFlag>{studioLink}</ClerkAdminFlag> : null}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <VerifiedOnlyToggle />
        <ThemePlaceholder />
        <ProfileAvatarLink />
      </div>
    </header>
  );
}

export function AppMobileHeader({
  title,
  backHref,
  showBrand = true,
  active = 'explore',
}: {
  title?: string;
  backHref?: string;
  showBrand?: boolean;
  active?: NavActiveId;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  let leading: ReactNode;
  if (backHref) {
    leading = (
      <Link
        href={backHref}
        className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95"
        aria-label="Go back"
      >
        <MaterialIcon name="arrow_back" />
      </Link>
    );
  } else {
    leading = (
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <MaterialIcon name={menuOpen ? 'close' : 'menu'} />
      </button>
    );
  }

  const mobileMenu = (isAdmin: boolean) => (
    <MobileNavMenu
      active={active}
      isAdmin={isAdmin}
      open={menuOpen && !backHref}
      onClose={() => setMenuOpen(false)}
    />
  );

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface px-margin-mobile shadow-sm md:hidden">
      <div className="flex items-center gap-2">
        {leading}
        {showBrand && !backHref ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center">
              <MaterialIcon name={BRAND_ICON} className="text-primary" size={40} />
            </div>
            <h1 className="font-display-lg text-3xl tracking-tight text-primary">Freshy</h1>
          </>
        ) : title ? (
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary">
            {title}
          </h1>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <VerifiedOnlyToggle />
        <ProfileAvatarLink />
      </div>
      {clerkEnabled ? <ClerkAdminFlag>{mobileMenu}</ClerkAdminFlag> : mobileMenu(false)}
    </header>
  );
}
