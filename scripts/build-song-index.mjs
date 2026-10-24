// Lists the songs in public/songs in public/songs/index.json, so the app knows what to fetch.
// Each song gets the smallest scale that holds every one of its notes, so the app does no work to sort them.
// Each song is also saved as the app's Song JSON in public/songs-json, so the app loads it without alphaTab.
// Run it after adding, renaming or removing a song file: pnpm songs:index
import * as alphaTab from "@coderline/alphatab";
import fs from "fs";
import { register } from "node:module";
import path from "path";
import { scalesMap } from "../src/app/data/scaleDefinitions.ts";
import {
  pickSongScale,
  toNoteMask,
} from "../src/app/engine/songs/songScale.ts";

register("./src-loader-hooks.mjs", import.meta.url);
const { readGuitarProSong } =
  await import("../src/app/engine/songs/gpReader.ts");
const { SONGS_JSON_DIR: SONGS_JSON_FOLDER, getSongJsonName } =
  await import("../src/app/engine/songs/songJson.ts");

const SONGS_DIR = "public/songs";
const SONGS_JSON_DIR = path.join("public", SONGS_JSON_FOLDER);
const SONG_FILE = /\.(gp|gp3|gp4|gp5|gpx)$/i;
// The songs are moved to an E tonic, and every scale counts from E
const E = 4;

const parseFileName = (fileName) => {
  const name = fileName.replace(/\.[^.]+$/, "");
  const separator = name.indexOf(" - ");
  return separator === -1
    ? { band: "", title: name }
    : {
        band: name.slice(0, separator).trim(),
        title: name.slice(separator + 3).trim(),
      };
};

// The app plays a tab note from the string and the fret, and any other note from its pitch
const getPitch = (note, tuning) =>
  note.isStringed && tuning.length
    ? tuning[tuning.length - note.string] + note.fret
    : note.realValue;

const getSongNotes = (score) =>
  score.tracks.flatMap((track) => {
    const staff = track.staves[0];
    if (!staff || staff.isPercussion) {
      return [];
    }
    return staff.bars.flatMap((bar) =>
      bar.voices.flatMap((voice) =>
        voice.beats.flatMap((beat) =>
          beat.notes.map((note) => getPitch(note, staff.tuning) - E),
        ),
      ),
    );
  });

const settings = new alphaTab.Settings();
const songFiles = fs
  .readdirSync(SONGS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && SONG_FILE.test(entry.name))
  .map(({ name }) => name);

const entries = songFiles
  .map((name) => {
    const bytes = new Uint8Array(fs.readFileSync(path.join(SONGS_DIR, name)));
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(
      bytes,
      settings,
    );
    const fromName = parseFileName(name);
    return {
      path: name,
      band: score.artist?.trim() || fromName.band,
      title: score.title?.trim() || fromName.title,
      ...pickSongScale(toNoteMask(getSongNotes(score)), scalesMap),
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

fs.writeFileSync(
  path.join(SONGS_DIR, "index.json"),
  JSON.stringify(entries, null, 2) + "\n",
);
console.log(`Listed ${entries.length} songs in ${SONGS_DIR}/index.json`);

fs.rmSync(SONGS_JSON_DIR, { recursive: true, force: true });
fs.mkdirSync(SONGS_JSON_DIR, { recursive: true });
for (const name of songFiles) {
  const bytes = new Uint8Array(fs.readFileSync(path.join(SONGS_DIR, name)));
  const song = await readGuitarProSong(bytes, name);
  fs.writeFileSync(
    path.join(SONGS_JSON_DIR, getSongJsonName(name)),
    JSON.stringify(song) + "\n",
  );
}
console.log(`Saved ${songFiles.length} songs as JSON in ${SONGS_JSON_DIR}`);
