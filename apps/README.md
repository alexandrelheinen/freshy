# Apps

| Package | Path      | Description                                                                            |
| ------- | --------- | -------------------------------------------------------------------------------------- |
| Web PWA | `web/`    | Next.js → Cloudflare Pages (Explore, Cooling, lists, place detail, profile, add place) |
| Mobile  | `mobile/` | Expo (Android & iOS, EAS builds on release)                                            |

### Web routes (Stitch-aligned)

| Route                 | Screen                  |
| --------------------- | ----------------------- |
| `/explore`            | Map home                |
| `/cooling`            | Categories              |
| `/cooling/[category]` | Place list by category  |
| `/saved`              | Saved places            |
| `/places/[slug]`      | Place detail            |
| `/profile`            | User profile            |
| `/profile/places/new` | Add a place (signed-in) |

```bash
pnpm --filter @freshy/web dev
pnpm --filter @freshy/mobile dev
```
