import type { CSSProperties } from 'react';

export type MaterialIconName =
  | 'ac_unit'
  | 'add'
  | 'add_a_photo'
  | 'add_location'
  | 'air'
  | 'arrow_back'
  | 'bookmark'
  | 'coffee'
  | 'cyclone'
  | 'directions'
  | 'distance'
  | 'electrical_services'
  | 'event_seat'
  | 'expand_more'
  | 'group'
  | 'laptop_mac'
  | 'local_cafe'
  | 'local_library'
  | 'location_on'
  | 'map'
  | 'menu_book'
  | 'mic'
  | 'museum'
  | 'my_location'
  | 'near_me'
  | 'nest_eco_leaf'
  | 'notifications'
  | 'park'
  | 'person'
  | 'publish'
  | 'remove'
  | 'restaurant'
  | 'reviews'
  | 'search'
  | 'share'
  | 'shopping_bag'
  | 'star'
  | 'thermometer'
  | 'thermostat'
  | 'tune'
  | 'verified'
  | 'volume_off'
  | 'water_drop'
  | 'wifi';

export function MaterialIcon({
  name,
  filled = false,
  className = '',
  size = 24,
}: {
  name: MaterialIconName;
  filled?: boolean;
  className?: string;
  size?: number;
}) {
  const style: CSSProperties = filled
    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
    : { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" };

  return (
    <span
      className={`material-symbols-outlined leading-none ${className}`}
      style={{ ...style, fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
