# Guitar Upscale

A guitar simulator in the browser. Play scales and chords on a virtual fretboard, record loops and export MIDI.

**Open the app:** https://oleg-chibikov.github.io/guitar-upscale/

![Guitar Upscale, dark theme](<public/screenshots/Guitar upscale - Dark.webp>)

## What it does

- **Fretboard** shows the notes of the chosen scale and plays them on tap.
- **Chords** come from the scale, with strumming patterns you can edit.
- **Looper** records what you play on several channels.
- **Piano roll** lets you edit a recording note by note.
- **MIDI** files can be downloaded or shared.
- **Instruments** go beyond guitar: sitar, banjo, koto, strings and more.

The app installs as a PWA, so it also works from the home screen.

## Run it locally

You need Node 24 and pnpm.

1. `pnpm install`
2. `pnpm exec next dev`
3. Open http://localhost:3000

`pnpm dev` calls the Windows `start` command. On macOS and Linux use `pnpm exec next dev`.

## Checks

- **Lint** `pnpm exec eslint .`
- **Tests** `pnpm exec jest`
- **Build** `pnpm exec next build`

## Deploy

Each push to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The workflow lints, tests, builds a static export and publishes it to GitHub Pages.

The Pages copy runs with sign-in off. The static export has no server, so the workflow deletes `src/pages/api` before the build.

Dependabot opens update PRs every week. The `automerge` job merges them once the build passes.

## Sign-in and tiers

Sign-in is off by default, and every visitor gets the Composer tier. Set `NEXT_PUBLIC_AUTH_ENABLED=true` to turn it on.

With sign-in on, the server needs these variables:

| Variable | What it is for |
| --- | --- |
| `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET` | Sign-in through Patreon |
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Checks Google Play subscriptions |
| `ANDROID_PACKAGE_ID` | The Android app id on Google Play |
| `COMPOSER_WHITELIST`, `EXPLORER_WHITELIST` | Emails that get a tier for free |

## Android app

The Android build wraps the PWA with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli).

1. Go to the folder where the APK should appear.
2. `bubblewrap init --manifest https://guitar-upscale.org.uk/manifest.json`
3. `bubblewrap build`

[PWABuilder](https://www.pwabuilder.com/reportcard?site=https://guitar-upscale.org.uk/) builds one online as well.
