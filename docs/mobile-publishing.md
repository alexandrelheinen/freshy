# Freshy mobile | app publishing guide

Reference for building and shipping Freshy on **Android** and **iOS**. The mobile app is a native **WebView shell** (`apps/mobile`) that loads the production web app (`https://getfreshy.pages.dev` by default). You do not maintain a separate mobile UI; store builds wrap the same site users see in the browser.

**First-time EAS setup:** [mobile-setup.md](mobile-setup.md).  
**Platform checklist and env vars:** [platforms.md](platforms.md#8-expo-eas--mobile-webview-shell).

---

## Distribution options at a glance

| Goal                           | Platform | Output          | Account cost                  | Freshy EAS profile | Typical channel      |
| ------------------------------ | -------- | --------------- | ----------------------------- | ------------------ | -------------------- |
| Sideload to testers            | Android  | `.apk`          | Free                          | `release`          | GitHub Release asset |
| Public store                   | Android  | `.aab`          | Google Play **$25 once**      | `production`       | Google Play Console  |
| Sideload to registered iPhones | iOS      | `.ipa` (ad hoc) | Apple Developer **~$99/year** | `release`          | GitHub Release asset |
| Beta testers (no UDID list)    | iOS      | `.ipa`          | Apple Developer **~$99/year** | `production`       | TestFlight           |
| Public store                   | iOS      | `.ipa`          | Apple Developer **~$99/year** | `production`       | App Store Connect    |

Profiles live in `apps/mobile/eas.json`:

| Profile      | `distribution` | Android             | iOS                             |
| ------------ | -------------- | ------------------- | ------------------------------- |
| `release`    | `internal`     | APK (sideload)      | Ad hoc IPA (registered devices) |
| `production` | store default  | App Bundle (`.aab`) | App Store / TestFlight build    |

---

## Accounts and dashboards

| Service             | URL                                                        | Purpose                                  |
| ------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Expo / EAS          | https://expo.dev/accounts/alexandrelheinen/projects/freshy | Cloud builds, credentials, build history |
| GitHub Actions      | https://github.com/alexandrelheinen/freshy/actions         | Release workflow (APK today)             |
| Google Play Console | https://play.google.com/console                            | Android store listing and rollout        |
| Apple Developer     | https://developer.apple.com/account                        | iOS signing, devices, certificates       |
| App Store Connect   | https://appstoreconnect.apple.com                          | TestFlight, App Store metadata, review   |
| Clerk               | https://dashboard.clerk.com                                | Sign-in inside the WebView shell         |

**Native identifiers** (from `apps/mobile/app.config.ts`):

| Platform        | Identifier                             |
| --------------- | -------------------------------------- |
| Android package | `app.freshy.mobile`                    |
| iOS bundle ID   | `app.freshy.mobile`                    |
| EAS project ID  | `ff3b74f8-863b-41cd-a83a-1c9f37a1dd42` |

---

## Shared one-time setup

Complete these before any store or release path.

### 1. Expo and EAS

```bash
pnpm install
cd apps/mobile
pnpm exec eas login
pnpm exec eas project:info   # should show @alexandrelheinen/freshy
```

Root `.env` (see `.env.example`):

```env
EXPO_TOKEN=...
EAS_PROJECT_ID=ff3b74f8-863b-41cd-a83a-1c9f37a1dd42
EXPO_PUBLIC_WEB_APP_URL=https://getfreshy.pages.dev
```

### 2. GitHub secrets (CI and releases)

https://github.com/alexandrelheinen/freshy/settings/secrets/actions

| Secret           | Required for      | Value                                              |
| ---------------- | ----------------- | -------------------------------------------------- |
| `EXPO_TOKEN`     | EAS builds in CI  | https://expo.dev/settings/access-tokens            |
| `EAS_PROJECT_ID` | Optional override | Same UUID as above (default is in `app.config.ts`) |

For **iOS ad hoc in CI** (when enabled), also add App Store Connect API key secrets so EAS can refresh provisioning profiles non-interactively:

| Secret               | Value                          |
| -------------------- | ------------------------------ |
| `EXPO_ASC_KEY_ID`    | App Store Connect API key ID   |
| `EXPO_ASC_ISSUER_ID` | App Store Connect issuer ID    |
| `EXPO_APPLE_TEAM_ID` | Apple Team ID                  |
| `EXPO_ASC_API_KEY`   | Contents of the `.p8` key file |

Create the API key in App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**.

### 3. First interactive build per platform

EAS must store signing credentials once in **interactive** mode before CI can run `--non-interactive`:

```bash
# Android (from repo root)
pnpm mobile:build:android
# Choose "Let Expo handle it" for the keystore when prompted.

# iOS (requires Apple Developer Program)
pnpm mobile:build:ios
# Sign in with Apple ID; choose "Let Expo manage credentials" when offered.
```

### 4. Clerk (sign-in inside the app)

The shell loads the production site. In Clerk Dashboard → your Freshy app:

- **Authorized parties** must include `https://getfreshy.pages.dev`.

**Sign in with Google:** Google blocks OAuth inside embedded WebViews. Freshy intercepts Google OAuth URLs and opens the **system browser** (Chrome Custom Tabs on Android, Safari sheet on iOS) via `expo-web-browser`, then returns to the WebView. Implementation: `apps/mobile/src/oauth-external-browser.ts` and `use-external-oauth-navigation.ts`. Rebuild the native app after auth-related changes.

Email and password sign-in generally works inside the WebView without the external browser handoff.

---

## Android

### Path A | GitHub Release APK (current default)

Best for **free** distribution to Android testers without Google Play.

**Build locally:**

```bash
pnpm mobile:build:android      # profile: release → APK
pnpm mobile:download:android   # → dist/mobile/freshy-latest-android.apk
```

**Automated on GitHub Release publish:**

1. Tag and publish a release (e.g. `v0.3.3`) on https://github.com/alexandrelheinen/freshy/releases
2. Workflow **Release | Mobile builds** (`.github/workflows/release.yml`) runs EAS with profile `release`
3. Asset attached: `freshy-<tag>-android.apk`

**Dry run without a release:** GitHub → **Actions** → **Release | Mobile builds** → **Run workflow** → download **Artifacts**.

**Install on a phone:**

1. Copy the APK to the device
2. Open the file; allow install from unknown sources if prompted
3. Open Freshy

### Path B | Google Play Store

Requires a **Google Play Developer** account ($25 one-time registration).

**1. Create the Play Console app**

1. https://play.google.com/console → **Create app**
2. Name: **Freshy**, default language, free app, accept declarations

**2. Build an App Bundle (not APK)**

```bash
cd apps/mobile
pnpm exec eas build --platform android --profile production --wait
```

Profile `production` sets `"buildType": "app-bundle"` in `eas.json`.

**3. Store listing (required before production)**

Play Console → **Grow** → **Store presence** → **Main store listing**:

- Short and full description
- App icon (512×512), feature graphic, phone screenshots (minimum 2)
- **Privacy policy URL** (required)

**4. Upload and roll out**

**Option A | EAS Submit (recommended after service account is linked)**

1. Play Console → **Setup** → **API access** → link a Google Cloud service account (see [Expo Submit to Google Play](https://docs.expo.dev/submit/android/))
2. Submit:

```bash
cd apps/mobile
pnpm exec eas submit --platform android --profile production
```

**Option B | Manual upload**

1. Download the `.aab` from the EAS build page
2. Play Console → **Release** → **Testing** → **Internal testing** (start here)
3. **Create new release** → upload `.aab` → **Review release** → **Start rollout**
4. Add testers, verify sign-in and core flows, then promote to **Production**

**Version codes:** `production` uses `"appVersionSource": "remote"` and `"autoIncrement": true`; EAS manages Android `versionCode` on Expo servers.

---

## iOS

iOS builds always require **Apple Developer Program** membership (~$99/year). You do not need a Mac to **build** (EAS cloud); you may need one to **install** ad hoc IPAs via Xcode, or use TestFlight / App Store for wider distribution.

### Path A | GitHub Release IPA (ad hoc sideload)

Same idea as the Android APK: internal distribution to **registered devices only**.

**1. Register each test iPhone**

```bash
cd apps/mobile
pnpm exec eas device:create
```

Follow the website or QR flow on the device. Verify at https://expo.dev/accounts/alexandrelheinen/projects/freshy/devices.

**2. Build and download**

```bash
pnpm mobile:build:ios
pnpm mobile:download:ios
# → dist/mobile/freshy-latest-ios.ipa
```

**3. Install on iPhone**

| Method                                                        | Notes                                             |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Mac + Xcode → **Window** → **Devices and Simulators** → **+** | Most reliable for ad hoc                          |
| Diawi or similar                                              | Upload IPA; link works only on registered devices |
| TestFlight                                                    | See Path B; easier for many testers               |

If install fails, the device UDID was likely not registered **before** the build. Run `eas device:create`, then rebuild.

**4. Attach to GitHub Release (manual or CI)**

Today CI (`.github/workflows/release.yml`) builds and attaches **Android APK only**. To attach `freshy-<tag>-ios.ipa` on the same release:

- Extend the workflow with iOS `eas build --platform ios --profile release --non-interactive --wait --refresh-ad-hoc-provisioning-profile`, download steps mirroring Android, and include `dist/mobile/*.ipa` in the release upload step; or
- Build locally and drag the `.ipa` onto the release page when publishing.

### Path B | TestFlight (beta, no per-device UDID)

Uses profile **`production`** and App Store Connect.

**1. Apple and Expo credentials**

- Enrolled in Apple Developer Program
- First iOS `production` build run interactively if credentials are not yet stored
- App record in App Store Connect (created automatically on first `eas submit` or manually in Connect)

**2. Build**

```bash
cd apps/mobile
pnpm exec eas build --platform ios --profile production --wait
```

**3. Submit to TestFlight**

```bash
pnpm exec eas submit --platform ios --profile production
```

**4. App Store Connect**

1. https://appstoreconnect.apple.com → your app → **TestFlight**
2. Complete **Export Compliance** and test information if prompted
3. Add **Internal** or **External** testers
4. Testers install via the TestFlight app

Rebuild and resubmit for each version you want testers to receive.

### Path C | App Store (public)

Same build and submit commands as TestFlight. After TestFlight validation:

1. App Store Connect → **App Store** tab → **Prepare for Submission**
2. Screenshots, description, keywords, age rating, privacy questionnaire
3. **App Review** submission (review often takes 24–48 hours or longer)

Apple **Guideline 4.8**: if you offer Google sign-in, you must also offer **Sign in with Apple** on iOS for App Store approval. Plan native Apple sign-in (e.g. `@clerk/expo` or Clerk Apple strategy) before a public iOS launch if Google is enabled.

---

## CI automation reference

| Trigger                  | Workflow                        | Current behavior                                | Target (both platforms on same tag) |
| ------------------------ | ------------------------------- | ----------------------------------------------- | ----------------------------------- |
| GitHub Release published | `Release \| Mobile builds`      | EAS `release` → Android APK → attach to release | Add iOS `release` build + IPA asset |
| Manual                   | Same workflow, **Run workflow** | APK as workflow artifact                        | Both APK and IPA as artifacts       |

Workflow file: `.github/workflows/release.yml`.

Store releases (Play / App Store) are **not** fully automated in CI today; use `eas build --profile production` and `eas submit` locally or add dedicated workflows when you are ready.

---

## Versioning

| Source                               | Used for                                                            |
| ------------------------------------ | ------------------------------------------------------------------- |
| `apps/mobile/package.json` `version` | User-visible app version (`read-app-version.cjs` → `app.config.ts`) |
| Git tag (e.g. `v0.3.3`)              | GitHub Release name and APK filename `freshy-v0.3.3-android.apk`    |
| EAS remote (`production`)            | Auto-incremented Android `versionCode` / iOS build number           |

Align tag, `package.json` version, and store listing version before a public store release.

---

## Pre-publish checklist

### Any native build

- [ ] `EXPO_PUBLIC_WEB_APP_URL` points at the intended environment
- [ ] Clerk authorized parties include that URL
- [ ] Sign-in tested on a physical device (Google OAuth and email if enabled)
- [ ] Location permission copy acceptable (`app.config.ts` `infoPlist` / Android permissions)

### GitHub Release (APK / ad hoc IPA)

- [ ] `EXPO_TOKEN` secret set
- [ ] First platform build completed interactively (credentials on EAS)
- [ ] iOS: all tester devices registered before ad hoc build

### Google Play

- [ ] Play Developer account ($25) active
- [ ] `production` AAB built and tested
- [ ] Store listing, privacy policy, screenshots complete
- [ ] Internal testing passed before production rollout

### App Store / TestFlight

- [ ] Apple Developer Program active
- [ ] `production` IPA built and submitted via `eas submit`
- [ ] TestFlight compliance questions answered
- [ ] Sign in with Apple planned if Google sign-in is offered (App Store)

---

## Command cheat sheet

| Task                               | Command                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Dev preview (Expo Go)              | `pnpm mobile:dev`                                                       |
| Android sideload APK               | `pnpm mobile:build:android` → `pnpm mobile:download:android`            |
| iOS ad hoc IPA                     | `pnpm mobile:build:ios` → `pnpm mobile:download:ios`                    |
| Both sideload builds               | `pnpm mobile:build`                                                     |
| Android store bundle               | `cd apps/mobile && pnpm exec eas build -p android --profile production` |
| iOS store build                    | `cd apps/mobile && pnpm exec eas build -p ios --profile production`     |
| Submit to Play / App Store Connect | `cd apps/mobile && pnpm exec eas submit --profile production`           |
| Register iOS test device           | `cd apps/mobile && pnpm exec eas device:create`                         |
| Watch builds                       | https://expo.dev/accounts/alexandrelheinen/projects/freshy/builds       |

---

## Related

- [mobile-setup.md](mobile-setup.md) | step-by-step first EAS setup
- [platforms.md](platforms.md#8-expo-eas--mobile-webview-shell) | env vars and platform checklist
- [local-development.md](local-development.md#mobile-shell-optional) | local mobile commands
- [Expo: internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [Expo: submit to Google Play](https://docs.expo.dev/submit/android/)
- [Expo: submit to App Store](https://docs.expo.dev/submit/ios/)
