import type { CSSProperties } from 'react';

export type MaterialIconName =
  | 'ac_unit'
  | 'add'
  | 'add_a_photo'
  | 'add_location'
  | 'air'
  | 'arrow_back'
  | 'bookmark'
  | 'bookmark_heart'
  | 'call_merge'
  | 'celebration'
  | 'check_circle'
  | 'chevron_left'
  | 'category_search'
  | 'climate_mini_split'
  | 'chevron_right'
  | 'close'
  | 'coffee'
  | 'cyclone'
  | 'dashboard_2_edit'
  | 'delete'
  | 'digital_wellbeing'
  | 'directions'
  | 'distance'
  | 'domain'
  | 'edit'
  | 'electrical_services'
  | 'event_seat'
  | 'explore'
  | 'expand_more'
  | 'filter_list'
  | 'group'
  | 'hourglass_empty'
  | 'laptop_mac'
  | 'layers'
  | 'local_cafe'
  | 'local_library'
  | 'location_on'
  | 'map'
  | 'menu'
  | 'menu_book'
  | 'mic'
  | 'museum'
  | 'my_location'
  | 'nature'
  | 'nest_farsight_cool'
  | 'near_me'
  | 'notifications'
  | 'park'
  | 'pending'
  | 'pending_actions'
  | 'person'
  | 'pets'
  | 'publish'
  | 'remove'
  | 'restaurant'
  | 'reviews'
  | 'routine'
  | 'satellite_alt'
  | 'search'
  | 'search_off'
  | 'settings'
  | 'share'
  | 'shopping_bag'
  | 'star'
  | 'sync'
  | 'theater_comedy'
  | 'thermometer'
  | 'thermostat'
  | 'tune'
  | 'verified'
  | 'volume_off'
  | 'warning'
  | 'water_drop'
  | 'wb_shade'
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
