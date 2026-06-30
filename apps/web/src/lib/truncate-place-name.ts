const DEFAULT_PLACE_NAME_MAX_LENGTH = 24;

export function truncatePlaceName(name: string, maxLength = DEFAULT_PLACE_NAME_MAX_LENGTH): string {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 1)}…`;
}
