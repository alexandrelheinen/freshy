/** Map search radius limits for explore and list views. */
export const MAP_SEARCH = {
  /** Maximum search radius in km (matches /places API schema max). */
  maxRadiusKm: 50,
  /** Minimum search radius in km. */
  minRadiusKm: 0.1,
  /** Category list pages show every place in the category, sorted by distance — no radius cap. */
  categoryListUsesRadiusFilter: false,
};
