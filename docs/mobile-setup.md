# Freshy mobile | setup from linked Expo project

You are here after `eas init` and a successful `eas project:info`:

```text
fullName  @alexandrelheinen/freshy
ID        ff3b74f8-863b-41cd-a83a-1c9f37a1dd42
```

Dashboard: https://expo.dev/accounts/alexandrelheinen/projects/freshy

The pnpm `overrides` warning and the eas-cli upgrade notice are harmless. You can ignore them.

---

## What you are building

| Thing              | What it is                                                         |
| ------------------ | ------------------------------------------------------------------ |
| **Web app**        | Live at https://freshy-25e.pages.dev                               |
| **Mobile app**     | Native shell that loads that site in a WebView                     |
| **EAS**            | Expo cloud builds: signed **APK** (Android) and **IPA** (iOS)      |
| **EXPO_TOKEN**     | API key so your machine and GitHub can talk to EAS                 |
| **EAS_PROJECT_ID** | Expo project UUID (default in `app.config.ts`; optional in `.env`) |

You do not need a Mac to build iOS. EAS builds in the cloud.

---

## Step 1 | Save the project ID in `.env` (not only `export`)

The `export` line works for one terminal session. Build scripts read **`.env`**.

In the **repository root** (copy from `.env.example` if needed), add:

```env
EAS_PROJECT_ID=ff3b74f8-863b-41cd-a83a-1c9f37a1dd42
EXPO_PUBLIC_WEB_APP_URL=https://freshy-25e.pages.dev
```

You can use `apps/mobile/.env` instead, or both. Do **not** commit `.env`.

Optional check (should match what you already saw):

```bash
cd apps/mobile
pnpm exec eas project:info
```

---

## Step 2 | Create an Expo access token

1. Open https://expo.dev/settings/access-tokens
2. Click **Create token** (or **Add token**)
3. Name it e.g. `freshy-local` or `freshy-github`
4. Copy the token once and store it safely

Add to the same `.env`:

```env
EXPO_TOKEN=paste_your_token_here
```

This is the same value you will use for GitHub Actions in Step 3.

---

## Step 3 | GitHub secrets (for release APK and IPA)

1. Open https://github.com/alexandrelheinen/freshy/settings/secrets/actions
2. Click **New repository secret** for each row:

| Secret name      | Value                                               |
| ---------------- | --------------------------------------------------- |
| `EXPO_TOKEN`     | Token from Step 2                                   |
| `EAS_PROJECT_ID` | Optional. Default is in `apps/mobile/app.config.ts` |

CI requires **`EXPO_TOKEN`**. The Expo project ID is committed in `app.config.ts`, so `EAS_PROJECT_ID` is only needed if you override it.

---

## Step 4 | Preview on a phone (optional)

From the repository root:

```bash
pnpm mobile:dev
```

- Scan the QR code with **Expo Go**, or press `a` / `i` for an emulator
- You should see the Freshy web app inside the shell

This step is optional. You can go straight to a signed APK in Step 5.

---

## Step 5 | Android (easiest path)

### Build

From the repository root:

```bash
pnpm mobile:build:android
```

**First build only:** EAS runs in interactive mode and asks about **Android credentials**. Choose **Let Expo handle it** (recommended). Expo stores the keystore on its servers; later builds (including GitHub Actions) can run non-interactively.

Watch progress at https://expo.dev/accounts/alexandrelheinen/projects/freshy/builds (often 10 to 20 minutes).

### Download

```bash
pnpm mobile:download:android
```

File: `dist/mobile/freshy-latest-android.apk`

### Install on a phone

1. Copy the APK to the phone (USB, Drive, email, etc.)
2. Open the file on the phone
3. Allow **Install from unknown sources** if Android asks
4. Open **Freshy**

No Google Play account is required for this internal APK.

---

## Step 6 | iOS (optional, Apple account required)

Skip this section if you only want Android this week.

Apple allows ad hoc IPAs on real iPhones only when:

- You have **Apple Developer Program** membership (~$99/year), and
- Each test iPhone is registered with Apple

### Register test devices

```bash
cd apps/mobile
pnpm exec eas device:create
```

Follow the prompts (website or QR on the phone). Repeat for each tester.

### Build and download

```bash
pnpm mobile:build:ios
pnpm mobile:download:ios
```

File: `dist/mobile/freshy-latest-ios.ipa`

First iOS build: sign in with the Apple ID linked to your Developer Program when EAS asks. Choose **Let Expo manage credentials** if offered.

### Install on iPhone

Typical options for ad hoc builds:

- **TestFlight** (later, for wider testing)
- **Xcode → Devices** on a Mac
- Upload services such as Diawi (link opens on a registered device only)

If install fails, the device UDID was probably not registered before the build. Run `eas device:create`, then **rebuild**.

---

## Step 7 | Ship via GitHub Release

After Step 3 (both secrets set):

1. GitHub repo → **Releases** → **Draft a new release**
2. Tag e.g. `v0.1.0` (**Create new tag** on publish)
3. Title e.g. `Freshy v0.1.0`
4. Click **Publish release**

What happens today:

1. Workflow **Release | Mobile builds** runs ( **Actions** tab )
2. EAS builds an Android APK and attaches `freshy-<tag>-android.apk`

**Dry run without a release:** **Actions** → **Release | Mobile builds** → **Run workflow** → download **Artifacts** from that run.

For iOS on the same tag, Play Store, TestFlight, and App Store paths, see [mobile-publishing.md](mobile-publishing.md).

---

## Step 8 | Clerk (sign-in inside the app)

The app loads `https://freshy-25e.pages.dev`, so Clerk behaves like the website.

In https://dashboard.clerk.com → your Freshy app:

- **Authorized parties** must include `https://freshy-25e.pages.dev`

You usually do not need a separate mobile origin for this WebView setup.

---

## Cheat sheet

| I want to…               | Do this                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| Confirm Expo link        | `cd apps/mobile && pnpm exec eas project:info`                          |
| Preview quickly          | `pnpm mobile:dev` + Expo Go                                             |
| Build Android            | `pnpm mobile:build:android` → `pnpm mobile:download:android`            |
| Build iOS                | Register devices → `pnpm mobile:build:ios` → `pnpm mobile:download:ios` |
| Attach both to a release | Publish GitHub Release + both GitHub secrets                            |
| Watch builds             | https://expo.dev/accounts/alexandrelheinen/projects/freshy/builds       |
| Change loaded site       | Set `EXPO_PUBLIC_WEB_APP_URL` in `.env`, then rebuild                   |

---

## Minimal path (Android only)

1. Step 1: `EAS_PROJECT_ID` in `.env` (you already verified it)
2. Step 2: `EXPO_TOKEN` in `.env`
3. Step 5: `pnpm mobile:build:android` → download APK
4. Step 3 when you want GitHub releases to attach the APK automatically

---

## If something breaks

| Problem                                                                | Likely fix                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `EAS_PROJECT_ID is not set`                                            | Add UUID to root `.env` (Step 1)                                                             |
| `Generating a new Keystore is not supported in --non-interactive mode` | Run `pnpm mobile:build:android` locally once (not in CI) and choose **Let Expo handle it**   |
| `@babel/runtime/helpers/interopRequireDefault` on EAS                  | Pull latest `apps/mobile` deps + `.npmrc`; run `pnpm install`; rebuild                       |
| Gradle fails on `expo-asset cannot be found`                           | Ensure `expo-asset` and `expo-linking` are in `apps/mobile` dependencies; run `pnpm install` |
| GitHub workflow fails on env                                           | Add both `EXPO_TOKEN` and `EAS_PROJECT_ID` secrets                                           |
| iOS build fails                                                        | Apple Developer account + `eas device:create` + rebuild                                      |
| App blank / white screen                                               | Open `EXPO_PUBLIC_WEB_APP_URL` in the phone browser                                          |
| Sign-in fails in app                                                   | Clerk authorized parties include `freshy-25e.pages.dev`                                      |

---

## Related

- [mobile-publishing.md](mobile-publishing.md) | full Android and iOS publishing reference (stores, TestFlight, GitHub releases)
- [platforms.md](platforms.md#8-expo-eas--mobile-webview-shell) | platform checklist
- [local-development.md](local-development.md#mobile-shell-optional) | local commands
