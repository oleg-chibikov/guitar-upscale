// Builds the built-in song list from the files in public/songs. Server only: the routes in
// src/app/songs/index.json and src/app/songs-json run it, and next build saves what they return.
import { scalesMap } from "@/app/data/scaleDefinitions";
import { readGuitarProSong } from "@/app/engine/songs/gpReader";
import { getSongJsonName } from "@/app/engine/songs/songJson";
import { parseBandAndTitle } from "@/app/engine/songs/songFileName";
import { pickSongScale, toNoteMask } from "@/app/engine/songs/songScale";
import type * as AlphaTab from "@coderline/alphatab";
import fs from "fs";
import path from "path";

export type SongIndexEntry = {
  path: string;
  band: string;
  title: string;
  scaleGroup: string;
  scale: string;
};

const SONGS_DIR = path.join(process.cwd(), "public", "songs");
const SONG_FILE = /\.(gp|gp3|gp4|gp5|gpx)$/i;
// The songs are moved to an E tonic, and every scale counts from E
const E = 4;

export const listSongFiles = () =>
  fs
    .readdirSync(SONGS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && SONG_FILE.test(entry.name))
    .map(({ name }) => name)
    .sort((a, b) => a.localeCompare(b));

const readSongBytes = (name: string) =>
  new Uint8Array(fs.readFileSync(path.join(SONGS_DIR, name)));

// The app plays a tab note from the string and the fret, and any other note from its pitch
const getPitch = (note: AlphaTab.model.Note, tuning: number[]) =>
  note.isStringed && tuning.length
    ? tuning[tuning.length - note.string] + note.fret
    : note.realValue;

const getSongNotes = (score: AlphaTab.model.Score) =>
  score.tracks.flatMap((track) => {
    const staff = track.staves.at(0);
    if (staff === undefined || staff.isPercussion) {
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

// Each song gets the smallest scale that holds every one of its notes, so the app does no work to sort them
export const buildSongIndex = async (): Promise<SongIndexEntry[]> => {
  const alphaTab = await import("@coderline/alphatab");
  const settings = new alphaTab.Settings();
  return listSongFiles().flatMap((name) => {
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(
      readSongBytes(name),
      settings,
    );
    const songScale = pickSongScale(toNoteMask(getSongNotes(score)), scalesMap);
    if (songScale === undefined) {
      return [];
    }
    const fromName = parseBandAndTitle(name);
    return [
      {
        path: name,
        band: score.artist?.trim() || fromName.band,
        title: score.title?.trim() || fromName.title,
        ...songScale,
      },
    ];
  });
};

export const findSongFileByJsonName = (jsonName: string) =>
  listSongFiles().find((name) => getSongJsonName(name) === jsonName);

export const readBuiltInSong = (name: string) =>
  readGuitarProSong(readSongBytes(name), name);
