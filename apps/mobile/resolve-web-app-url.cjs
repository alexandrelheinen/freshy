const DEFAULT_WEB_APP_URL = 'https://getfreshy.pages.dev';
const PLACEHOLDER_VALUES = new Set(['undefined', 'null']);

function isPlaceholder(value) {
  return PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}

/** @param {string | undefined | null} value */
function isUsableWebAppUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || isPlaceholder(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    if (!parsed.hostname || isPlaceholder(parsed.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** @param {...(string | undefined | null)} candidates */
function resolveWebAppUrl(...candidates) {
  for (const candidate of candidates) {
    if (isUsableWebAppUrl(candidate)) {
      return candidate.trim().replace(/\/$/, '');
    }
  }
  return DEFAULT_WEB_APP_URL;
}

module.exports = { DEFAULT_WEB_APP_URL, resolveWebAppUrl };
