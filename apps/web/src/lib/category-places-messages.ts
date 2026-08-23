/** Empty-state copy for a cooling category list, including the verified-only filter. */
export function categoryPlacesEmptyMessage(
  title: string,
  verifiedOnly: boolean,
  query?: string,
): string {
  const label = title.toLowerCase();
  const trimmed = query?.trim();
  if (trimmed) {
    return `No ${label} match "${trimmed}".`;
  }
  if (verifiedOnly) {
    return `No verified ${label} yet.`;
  }
  return `No ${label} in the database yet.`;
}
