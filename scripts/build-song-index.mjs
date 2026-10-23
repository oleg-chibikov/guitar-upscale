// Lists the songs in public/songs in public/songs/index.json, so the app knows what to fetch.
// Each song gets the smallest scale that holds every one of its notes, so the app does no work to sort them.
// Run it after adding, renaming or removing a song file: pnpm songs:index
import * as alphaTab from "@coderline/alphatab";
import fs from "fs";
import path from "path";
import { scalesMap } from "../src/app/data/scaleDefinitions.ts";
import { pickSongScale, toNoteMask } from "../src/app/engine/songs/songScale.ts";

const SONGS_DIR = "public/songs";
const SONG_FILE = /\.(gp|gp3|gp4|gp5|gpx)$/i;
// The songs are moved to an E tonic, and every scale counts from E
const E = 4;

const parseFileName = (fileName) => {
  const name = fileName.replace(/\.[^.]+$/, "");
  const separator = name.indexOf(" - ");
  return separator === -1
    ? { band: "", title: name }
    : { band: name.slice(0, separator).trim(), title: name.slice(separator + 3).trim() };
};

// The app plays a tab note from the string and the fret, and any other note from its pitch
const getPitch = (note, tuning) =>
  note.isStringed && tuning.length ? tuning[tuning.length - note.string] + note.fret : note.realValue;

const getSongNotes = (score) =>
  score.tracks.flatMap((track) => {
    const staff = track.staves[0];
    if (!staff || staff.isPercussion) {
      return [];
    }
    return staff.bars.flatMap((bar) =>
      bar.voices.flatMap((voice) =>
        voice.beats.flatMap((beat) => beat.notes.map((note) => getPitch(note, staff.tuning) - E))
      )
    );
  });

const settings = new alphaTab.Settings();
const entries = fs
  .readdirSync(SONGS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && SONG_FILE.test(entry.name))
  .map(({ name }) => {
    const bytes = new Uint8Array(fs.readFileSync(path.join(SONGS_DIR, name)));
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(bytes, settings);
    const fromName = parseFileName(name);
    return {
      path: name,
      band: score.artist?.trim() || fromName.band,
      title: score.title?.trim() || fromName.title,
      ...pickSongScale(toNoteMask(getSongNotes(score)), scalesMap),
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

fs.writeFileSync(path.join(SONGS_DIR, "index.json"), JSON.stringify(entries, null, 2) + "\n");
console.log(`Listed ${entries.length} songs in ${SONGS_DIR}/index.json`);
