# Guitar Upscale

A guitar simulator in the browser. Play scales and chords on a virtual fretboard, record loops and export MIDI.

**Open the app:** https://oleg-chibikov.github.io/guitar-upscale/

![Guitar Upscale, dark theme](<public/screenshots/Guitar upscale - Dark.webp>)

## What it does

- **Fretboard** shows the notes of the chosen scale and plays them on tap.
- **Chords** come from the scale, with strumming patterns you can edit.
- **Looper** records what you play on several channels.
- **Piano roll** edits a melody, a MIDI recording or a looper channel note by note.
- **MIDI** files can be downloaded or shared.
- **Instruments** go beyond guitar: sitar, banjo, koto, strings and more.

The app installs as a PWA, so it also works from the home screen.

## Docs

- **[Overview](docs/README.md)** the big picture on one page.
- **[Features](docs/features.md)** what each part of the screen does.
- **[User flows](docs/user-flows.md)** common tasks step by step, with diagrams.
- **[Architecture](docs/architecture.md)** how the code fits together.

## Piano roll keys

| Key | Action |
| --- | --- |
| Space | Play or stop the shown track from the playhead |
| 1, 2, 3 | Select, draw, erase |
| Hold Alt | Draw notes with any tool |
| Alt + drag a note | Copy the notes |
| Ctrl or Cmd + drag | Keep the drag in time or in pitch |
| Arrows | Move the selection a grid step or a scale step. Shift moves an octave |
| Q | Quantize to the grid |
| Ctrl or Cmd + Z, Shift + Z | Undo, redo |
| Ctrl or Cmd + C, X, V, D | Copy, cut, paste at the playhead, duplicate |
| G, H, F | Zoom out, zoom in, fit all notes. Shift zooms the rows |
| Home | Playhead to the start |

On a touch screen, hold empty space and drag to select an area, and pinch to zoom. The toolbar toggles stand in for Alt and Ctrl.

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

## Songs

Each song is a Guitar Pro file in [`public/songs`](public/songs), one file per song.

- **Place** `public/songs/<Scale group>/<Scale>/<Band> - <Title>.gp`, for example `Minor/Dorian/Santana - Oye Como Va.gp`. A `/` in a name becomes `-`, so "Aeolian / Natural" sits in `Aeolian - Natural`.
- **Key** write the song in E. The app moves it to the key picked in the settings.
- **Chords** go on a track named `Chords`. Each chord needs its name above the beat (the chord diagram name in Guitar Pro). The app plays it as its own chord with the strum settings. A beat with no name gets a name from its notes.
- **Melody** tracks play the tab as written. A track named `Melody` plays with the instrument picked in the app, other tracks keep their own instrument.
- **List** run `pnpm songs:index` after adding, renaming or removing a file. It writes `public/songs/index.json`. `pnpm build` runs it too.

People add their own songs in the app with the upload button [Composer]. It takes Guitar Pro (`.gp`, `.gp3` to `.gp5`, `.gpx`) and MIDI files. The browser keeps them, and the scale detector picks the scale.

In a MIDI file a track named `Chords` plays as chords. A text or marker event like `Am` at the chord names it. Other tracks play as notes, with no chord guessing.

- **Download a song** hold Play and press the download icon next to it. The file is a `.gp` in the key and tuning from the settings, uploads in `.gp5`, `.gpx` or MIDI included.
- **Edit a song** change notes in the piano roll. The edits save on their own: an uploaded song updates, a built-in song gets an own copy under the same name.
- **Download the edits** the Download button saves what plays now as `.gp`. Hold it for MIDI.

## Add a song from Songsterr

`pnpm songsterr` downloads a song from Songsterr and saves it as a Guitar Pro file in `public/songs`.

1. `pnpm songsterr "wintersun beyond the dark sun"` lists the tracks and sections.
2. `pnpm songsterr "wintersun beyond the dark sun" --from 4 --to 16` adds measures 4 to 16.

- **Key** the song moves to an E tonic, since the app builds every scale from E.
- **Scale** the script picks the scale from `scales.ts` with the fewest notes outside it, or the one from `--scale "Minor/Dorian"`. It moves those notes to the nearest scale note. It prints each change.
- **Tracks** melody, a bass with one note per beat, and a `Chords` track built on the bass.
- **Rerun** replaces the file with the same band and title, and refreshes `index.json`.

`--help` lists the options: `--section`, `--track`, `--bass`, `--tonic`, `--scale`, `--dry-run` and more. Songsterr has no public API, so the script can break when the site changes.

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
