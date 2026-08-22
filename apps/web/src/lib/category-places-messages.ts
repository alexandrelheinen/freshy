/** Empty-state copy for a cooling category list, including the verified-only filter. */
export function categoryPlacesEmptyMessage(title: string, verifiedOnly: boolean): string {
  const label = title.toLowerCase();
  if (verifiedOnly) {
    return `No verified ${label} yet.`;
  }
  return `No ${label} in the database yet.`;
}
