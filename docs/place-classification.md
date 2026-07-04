# Place classification | Freshy

Freshy classifies every place with two independent systems: **tags** (what the spot feels like) and **freshness levels** (how cool it is). Both catalogs live in `packages/config/` as YAML files and are validated by `@freshy/config` tests.

---

## Place categories

**API and database keyword:** each place stores a `category` enum value (for example `MUSEUM`).

**UI labels and icons:** the web app reads display copy from `@freshy/ui` (`PLACE_CATEGORY_LABELS`, `PLACE_CATEGORY_ICONS`). Labels and icons can differ from the stored keyword when the product name is broader than the legacy enum.

| Keyword (`Place.category`) | UI label       | UI icon          | Notes |
| -------------------------- | -------------- | ---------------- | ----- |
| `CAFE`                     | Cafés & Bakeries | (theme)        | |
| `RESTAURANT`               | Restaurants    | (theme)          | |
| `BAR`                      | Bars           | (theme)          | |
| `LIBRARY`                  | Libraries      | (theme)          | |
| `MALL`                     | Malls & Shops  | (theme)          | |
| `MUSEUM`                   | Arts & Culture | `theater_comedy` | Historical keyword. The category covers museums, galleries, theaters, and similar cultural venues, not only museums. |
| `COWORKING`                | Coworking      | (theme)          | |
| `PUBLIC_SPACE`             | Public Spaces  | (theme)          | |

When adding a category, update the Drizzle enum, API validation, seed mappers, and `@freshy/ui` labels. Change UI copy in `packages/ui/src/tokens.ts` only unless the stored keyword also changes.

---

## Tags

**Config file:** [`packages/config/place-tags.yaml`](../packages/config/place-tags.yaml)

Tags are optional labels stored on each place as `Place.tags` (JSON string array in D1). Only IDs listed in the YAML catalog are accepted by the API.

| ID             | Label        | Icon       |
| -------------- | ------------ | ---------- |
| `calm`         | Calm         | spa        |
| `comfortable`  | Comfortable  | event_seat |
| `pet_friendly` | Pet Friendly | pets       |
| `shaded`       | Shaded       | wb_shade   |
| `quiet`        | Quiet        | volume_off |
| `free_wifi`    | Free Wi-Fi   | wifi       |

### How tags flow through the stack

1. Edit `place-tags.yaml` and keep [`place-tags.ts`](../packages/config/place-tags.ts) runtime exports in sync (tests enforce this).
2. API create and studio update routes validate tag IDs with `z.enum(PLACE_TAG_IDS)`.
3. Web UI reads labels and icons from `@freshy/ui` (re-exported from `@freshy/config/place-tags`).
4. Seed data assigns category-appropriate tags per place.

### Adding a tag

1. Add an entry to `place-tags.yaml`.
2. Mirror it in the `PLACE_TAGS` array inside `place-tags.ts`.
3. Run `pnpm --filter @freshy/config test`.

---

## Freshness levels

**Config file:** [`packages/config/freshness-levels.yaml`](../packages/config/freshness-levels.yaml)

Freshness describes cooling quality. Each place stores one level in `Place.aggregatedFreshnessLevel`. The UI renders a three-segment bar: blue segments grow from ventilation through strong AC; the top tier **Naturally Fresh** fills all three segments in green.

| Level | ID                 | Label            |        Bar | Color   |
| ----: | ------------------ | ---------------- | ---------: | ------- |
|     0 | `NONE`             | No Cooling       | 0 segments | neutral |
|     1 | `GOOD_VENTILATION` | Good Ventilation |  1 segment | blue    |
|     2 | `MODEST_AC`        | Modest AC        | 2 segments | blue    |
|     3 | `VERY_COLD_AC`     | Very Cold AC     | 3 segments | blue    |
|     4 | `NATURALLY_FRESH`  | Naturally Fresh  | 3 segments | green   |

### Level meanings

- **None (0):** No air conditioning or mechanical cooling. Rare; reserved for iconic spots that stay cool without infrastructure.
- **Good ventilation (1):** Airflow or light ventilation without strong AC. Lowest blue tier.
- **Modest AC (2):** Pleasant, modest air conditioning.
- **Very cold AC (3):** Powerful AC for maximum heat relief. Highest mechanical tier.
- **Naturally fresh (4):** Cool thanks to shade, water, or greenery. Pinnacle quality of life; no AC required.

### How freshness flows through the stack

1. Edit `freshness-levels.yaml` and keep [`freshness-levels.ts`](../packages/config/freshness-levels.ts) in sync.
2. Drizzle schema `FreshnessLevel` type mirrors the YAML IDs.
3. API validates levels on create and studio update.
4. UI components `FreshnessBar` and `FreshnessSnowflakes` use `barSegments` and `tone` from config.

### Migration note

The former three-value `AcStrength` enum (`LIGHTLY_COOLED`, `COMFORTABLE`, `FRIGID`) maps to levels 1–3. Level 0 and 4 are new.

---

## Related docs

- [Database schema](database.md)
- [Architecture](architecture.md)
- [Quality standards](quality-standards.md)
