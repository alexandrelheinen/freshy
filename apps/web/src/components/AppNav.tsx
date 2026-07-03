'use client';

import { useUser } from '@clerk/clerk-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  BRAND_ICON,
  BRAND_NAME,
  MaterialIcon,
  NAV_ICONS,
  ROUTES,
  themePreferenceLabel,
  useTheme,
  type MaterialIconName,
  type ThemePreference,
} from '@freshy/ui';
import { DESKTOP_NAV_ITEMS, MOBILE_MENU_NAV_ITEMS } from '../lib/nav-config';
import { isStudioAdmin } from '../lib/studio-api';
import { useVerifiedOnlyFilter } from '../lib/use-verified-only-filter';

export type NavActiveId = 'explore' | 'cooling' | 'profile' | 'studio';

/** Shared height for header controls (nav links, utilities). Logo uses natural metrics. */
const HEADER_CONTROL_CLASS = 'h-10';

/** Icon + wordmark as one lockup: no gap, optical offset from theme tokens. */
function BrandLockup({
  iconSize,
  textClassName,
  as: Text = 'span',
  className = '',
}: {
  iconSize: 32 | 40;
  textClassName: string;
  as?: 'span' | 'h1';
  className?: string;
}) {
  const wordmarkTuck = iconSize === 40 ? '-ml-2' : '-ml-1.5';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <MaterialIcon
        name={BRAND_ICON}
        className="shrink-0 leading-none text-primary"
        size={iconSize}
      />
      <Text
        className={`m-0 shrink-0 p-0 font-logo tracking-logo leading-none text-primary ${wordmarkTuck} translate-y-[var(--font-logo-offset-y,-0.08em)] ${textClassName}`}
      >
        {BRAND_NAME}
      </Text>
    </div>
  );
}

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkAdminFlag({ children }: { children: (isAdmin: boolean) => ReactNode }) {
  const { user } = useUser();
  return <>{children(isStudioAdmin(user?.publicMetadata))}</>;
}

function ThemeMenu({ variant = 'header' }: { variant?: 'header' | 'menu' }) {
  const { preference, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options: ThemePreference[] = ['default', 'dark', 'system'];

  if (variant === 'menu') {
    return (
      <div className="border-t border-outline-variant/20 pt-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left font-label-caps text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          aria-label="Theme"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <MaterialIcon name="routine" size={22} className="shrink-0" />
          <span className="flex-1">Theme</span>
          <span className="font-body-sm text-on-surface-variant">
            {themePreferenceLabel(preference)}
          </span>
          <MaterialIcon
            name="expand_more"
            size={20}
            className={`shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open ? (
          <div role="listbox" aria-label="Theme" className="mb-1 space-y-0.5 pl-9 pr-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={preference === option}
                onClick={() => {
                  setTheme(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-body-sm transition-colors hover:bg-surface-container ${
                  preference === option ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {themePreferenceLabel(option)}
                {preference === option ? (
                  <MaterialIcon name="check_circle" size={18} className="text-primary" filled />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-surface-container-high px-3 text-on-surface-variant transition-colors hover:text-primary"
        aria-label="Theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MaterialIcon name="routine" size={20} className="shrink-0 leading-none text-current" />
        <span className="hidden font-label-caps leading-none sm:inline">
          {themePreferenceLabel(preference)}
        </span>
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-popover cursor-default"
            aria-label="Close theme menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label="Theme"
            className="absolute right-0 z-popover mt-2 min-w-36 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-1 shadow-lg"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={preference === option}
                onClick={() => {
                  setTheme(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left font-body-sm transition-colors hover:bg-surface-container ${
                  preference === option ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {themePreferenceLabel(option)}
                {preference === option ? (
                  <MaterialIcon name="check_circle" size={18} className="text-primary" filled />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function VerifiedOnlyToggle({
  onToggle,
  variant = 'header',
}: {
  onToggle?: () => void;
  variant?: 'header' | 'menu';
}) {
  const { verifiedOnly, setVerifiedOnly } = useVerifiedOnlyFilter();

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={() => {
          setVerifiedOnly(!verifiedOnly);
          onToggle?.();
        }}
        aria-pressed={verifiedOnly}
        aria-label={
          verifiedOnly ? 'Showing verified places only' : 'Show all places including unverified'
        }
        className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left font-label-caps text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
      >
        <MaterialIcon name="verified" filled={verifiedOnly} size={22} className="shrink-0" />
        <span className="flex-1">Verified only</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            verifiedOnly
              ? 'bg-primary-container text-primary'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          {verifiedOnly ? 'On' : 'Off'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setVerifiedOnly(!verifiedOnly);
        onToggle?.();
      }}
      aria-pressed={verifiedOnly}
      aria-label={
        verifiedOnly ? 'Showing verified places only' : 'Show all places including unverified'
      }
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        verifiedOnly
          ? 'bg-primary-container text-primary'
          : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
      }`}
    >
      <MaterialIcon name="verified" filled={verifiedOnly} size={20} className="leading-none text-current" />
    </button>
  );
}

function ClerkProfileAvatarLink({ className = '' }: { className?: string }) {
  const { isSignedIn, user } = useUser();

  return (
    <Link
      href={ROUTES.profile}
      className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-primary-container/30 ${className}`}
      aria-label="Profile"
    >
      {isSignedIn && user?.imageUrl ? (
        <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <MaterialIcon name="digital_wellbeing" size={20} className="leading-none text-primary" />
      )}
    </Link>
  );
}

function ProfileAvatarLink({ className = '' }: { className?: string }) {
  if (!clerkEnabled) {
    return (
      <Link
        href={ROUTES.profile}
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-primary-container/30 ${className}`}
        aria-label="Profile"
      >
        <MaterialIcon name="digital_wellbeing" size={20} className="leading-none text-primary" />
      </Link>
    );
  }

  return <ClerkProfileAvatarLink className={className} />;
}

function NavLink({
  href,
  label,
  iconName,
  isActive,
  onClick,
  variant = 'menu',
}: {
  href: string;
  label: string;
  iconName: MaterialIconName;
  isActive: boolean;
  onClick?: () => void;
  variant?: 'menu' | 'bar';
}) {
  const layoutClass =
    variant === 'bar'
      ? `group inline-flex ${HEADER_CONTROL_CLASS} items-center gap-2 rounded-lg px-3`
      : 'group flex items-center gap-3 rounded-lg px-2 py-3';

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${layoutClass} font-label-caps transition-colors ${
        isActive
          ? 'text-primary'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
      }`}
    >
      <MaterialIcon
        name={iconName}
        filled={isActive}
        size={20}
        className="shrink-0 leading-none transition-transform group-hover:scale-110"
      />
      <span className="leading-none">{label}</span>
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
    <nav className="absolute left-0 right-0 top-16 z-nav border-b border-outline-variant/20 bg-surface shadow-lg md:hidden">
      <div className="flex flex-col gap-0.5 px-margin-mobile py-3">
        {MOBILE_MENU_NAV_ITEMS.map((item) => (
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
        <div className="mt-1 border-t border-outline-variant/20 pt-1">
          <VerifiedOnlyToggle variant="menu" />
          <ThemeMenu variant="menu" />
        </div>
        <div className="border-t border-outline-variant/20 pt-1">
          <NavLink
            href={ROUTES.profile}
            label="Profile"
            iconName={NAV_ICONS.profile as MaterialIconName}
            isActive={active === 'profile'}
            onClick={onClose}
          />
        </div>
      </div>
    </nav>
  );
}

/** @deprecated Bottom navigation replaced by the mobile header menu. */
export function AppBottomNav(_props: { active?: NavActiveId }) {
  return null;
}

export function AppTopNav({ active = 'explore' }: { active?: NavActiveId }) {
  return (
    <header className="fixed top-0 z-nav hidden h-16 w-full items-center bg-surface px-10 shadow-sm md:flex">
      <Link
        href={ROUTES.explore}
        className="inline-flex shrink-0 items-center"
        aria-label={`${BRAND_NAME} home`}
      >
        <BrandLockup iconSize={40} textClassName="text-[2.5rem]" />
      </Link>

      <nav className="ml-10 flex items-center gap-6 lg:ml-12 lg:gap-8" aria-label="Primary">
        {DESKTOP_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            href={item.href}
            label={item.label}
            iconName={NAV_ICONS[item.id] as MaterialIconName}
            isActive={active === item.id}
            variant="bar"
          />
        ))}
        {clerkEnabled ? (
          <ClerkAdminFlag>
            {(isAdmin) =>
              isAdmin ? (
                <NavLink
                  href={ROUTES.studio}
                  label="Studio"
                  iconName="dashboard_2_edit"
                  isActive={active === 'studio'}
                  variant="bar"
                />
              ) : null
            }
          </ClerkAdminFlag>
        ) : null}
      </nav>

      <div className="ml-auto flex h-10 shrink-0 items-center gap-3">
        <VerifiedOnlyToggle />
        <ThemeMenu />
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
        className={`inline-flex ${HEADER_CONTROL_CLASS} w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 active:scale-95`}
        aria-label="Go back"
      >
        <MaterialIcon name="arrow_back" className="leading-none" />
      </Link>
    );
  } else {
    leading = (
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={`inline-flex ${HEADER_CONTROL_CLASS} w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 active:scale-95`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <MaterialIcon name={menuOpen ? 'close' : 'menu'} className="leading-none" />
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

  const showHeaderUtilities = Boolean(backHref);

  return (
    <header className="fixed top-0 z-nav flex h-16 w-full items-center justify-between bg-surface px-margin-mobile shadow-sm md:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {leading}
        {showBrand && !backHref ? (
          <BrandLockup as="h1" iconSize={32} textClassName="truncate text-[2rem]" className="min-w-0" />
        ) : title ? (
          <h1 className="truncate font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary">
            {title}
          </h1>
        ) : null}
      </div>
      <div className={`flex shrink-0 items-center gap-2 ${HEADER_CONTROL_CLASS}`}>
        {showHeaderUtilities ? (
          <>
            <VerifiedOnlyToggle />
            <ThemeMenu />
          </>
        ) : null}
        <ProfileAvatarLink />
      </div>
      {clerkEnabled ? <ClerkAdminFlag>{mobileMenu}</ClerkAdminFlag> : mobileMenu(false)}
    </header>
  );
}
