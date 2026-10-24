---
name: add-song
description: 'Use when asked to add, import or download a built-in example song, or to grow the song list: "add a song", "add Metallica - One", "import from Songsterr", "more example songs", "добавь песню". Downloads a section from Songsterr with pnpm songsterr, saves it as a Guitar Pro file in public/songs, rebuilds the song index, checks the song in the app and commits it.'
argument-hint: '"<artist> <title>" and optionally a section, e.g. "Chorus"'
---

# Add a built-in song

A built-in song is a short part of a real song, moved to E. The app shows it in the song list under the scale that fits its notes.

## What gets written

- **`public/songs/<Band> - <Title>.gp`** the song as a Guitar Pro file.
- **`public/songs/index.json`** the song list with a scale for each song.
- **`public/songs-json/<Band> - <Title>.json`** the song as app JSON, so the app loads it without alphaTab.

The last two come from `pnpm songs:index`. `pnpm songsterr` runs it after a save. Commit all of them.

## Steps

1. List the tracks and sections. Without `--section` or `--from/--to` the script saves no file:
   ```sh
   pnpm songsterr "Metallica One"
   ```
2. Pick the part people know, usually the riff, the intro or the chorus. Keep it short, about 4 to 16 bars.
3. Try it with `--dry-run` and read the output:
   ```sh
   pnpm songsterr "Metallica One" --section "Verse Riff" --dry-run
   ```
4. Fix what the output shows, then run step 3 again. See [Reading the output](#reading-the-output).
5. Run the same command without `--dry-run`. It saves the file and rebuilds the index.
6. Check the song in the app. See [Check in the app](#check-in-the-app).
7. Run `pnpm exec jest`, then commit with a message like `Add Metallica - One to the built-in songs`.

## Reading the output

| Line                                              | What to do                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Wrong song or artist** in the first line        | pass `--song-id N` from the Songsterr URL                                      |
| **`The melody track is empty in these measures`** | pass `--track N` with a track from step 1 that plays there                     |
| **`Tonic X`** is wrong                            | pass `--tonic` with the real key of the part, e.g. `--tonic "C#"`              |
| **`Notes moved into the scale`** lists many notes | the scale is too narrow. Pass a wider `--scale`, e.g. `--scale "Minor/Dorian"` |
| **`Chords:`** has a chord the song doesn't play   | the chords stay inside the scale. Pick a scale that holds the real chord       |
| **`No bass found`**                               | pass `--bass N` with a bass track from step 1, or `--no-bass`                  |
| **`Tracks:`** misses a part people know           | add it with `--extra N`, or `--extra all` for every track except drums         |

A narrow scale breaks chords. E Aeolian has no F, so the bII chord of Rammstein "Sonne" came out as Em. Commit `bfe09e5` fixed it by hand.

`--band` and `--title` set the names in the app and in the file name. Use them when the Songsterr names have extra words, like "(Live)".

## Check in the app

1. Start the app with `pnpm exec next dev`. The `pnpm dev` script fails on macOS.
2. Open `http://localhost:3000`.
3. Right click or hold Play to open the song list. Type the song name in the search field.
4. Play the song. Listen for wrong notes and check the chords on the fretboard.

## Replace or remove a song

- **Replace** run `pnpm songsterr` again with the same names. It writes over the file.
- **Rename or remove** change the file in `public/songs`, then run `pnpm songs:index`.
