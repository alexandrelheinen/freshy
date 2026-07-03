import { LOCAL_API_URL, PRODUCTION_API_URL } from '@freshy/config/public-api';

function normalizeApiBase(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function isLikelyPagesHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.pages.dev');
  } catch {
    return false;
  }
}

function isProductionWebHost(hostname: string): boolean {
  return (
    hostname.endsWith('.pages.dev') ||
    hostname === 'freshy.app' ||
    hostname.endsWith('.freshy.app')
  );
}

/** Resolve the API Worker base URL at call time (important for static Pages builds). */
export function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL
    ? normalizeApiBase(process.env.NEXT_PUBLIC_API_URL)
    : '';

  if (
    configured &&
    configured !== LOCAL_API_URL &&
    !configured.includes('localhost') &&
    !isLikelyPagesHost(configured)
  ) {
    return configured;
  }

  if (typeof window !== 'undefined' && isProductionWebHost(window.location.hostname)) {
    return PRODUCTION_API_URL;
  }

  return configured || LOCAL_API_URL;
}

/** @deprecated Use getApiBase() for client fetches so production Pages builds resolve correctly. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? LOCAL_API_URL;
