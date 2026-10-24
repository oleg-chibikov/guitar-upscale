#!/usr/bin/env node
// Downloads a song from Songsterr and saves it as a Guitar Pro file in public/songs.
// The app builds every scale from E, so the song is moved to an E tonic first.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  getInstrumentForProgram,
  getProgramForInstrument,
} from "../src/app/data/instruments.ts";
import { CHROMATIC, scalesMap } from "../src/app/data/scaleDefinitions.ts";
import { writeGuitarPro } from "../src/app/engine/songs/gpWriter.ts";
import {
  NOTE_NAMES,
  convertSongsterr,
  findSection,
  isSongsterrDrums,
  listPlayableTrackIndexes,
  listScales,
  pickMelodyIndex,
  listSections,
  songsterrProgram,
  songsterrSearchUrl,
  songsterrTrackName,
  songsterrTrackUrl,
} from "../src/app/engine/songs/songsterr.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SONGS_DIR = resolve(ROOT, "public/songs");

const HELP = `Usage: pnpm songsterr "<artist and title>" [options]

Without --section or --from/--to it lists the tracks and sections and stops.

  --song-id N       Songsterr song id instead of the search
  --track N         melody track (default: the most popular one)
  --bass N          bass track (default: the most popular bass track)
  --no-bass         skip the bass and the chords
  --extra N,N|all   more tracks with their own instruments, "all" skips drums
  --section NAME    take the measures of one section, e.g. "Chorus"
  --from N --to N   measure range, 1-based and inclusive, as on the site
  --tonic NOTE      tonic of the source, e.g. "C#" (default: guessed from the bass)
  --scale G/NAME    target scale, e.g. "Minor/Dorian" (default: the best fit)
  --band, --title   names to show in the app
  --dir PATH        songs folder (default: public/songs)
  --dry-run         print what it found and save nothing`;

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "song-id": { type: "string" },
    track: { type: "string" },
    bass: { type: "string" },
    "no-bass": { type: "boolean" },
    extra: { type: "string" },
    section: { type: "string" },
    from: { type: "string" },
    to: { type: "string" },
    tonic: { type: "string" },
    scale: { type: "string" },
    band: { type: "string" },
    title: { type: "string" },
    dir: { type: "string" },
    "dry-run": { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) fail(`${response.status} for ${url}`);
  return response.json();
};

const findSong = async () => {
  if (opts["song-id"]) return Number(opts["song-id"]);
  const query = positionals.join(" ");
  if (!query) fail(HELP);
  const songs = await getJson(songsterrSearchUrl(query));
  const song = songs.find((s) => s.hasPlayer) ?? fail(`No song for "${query}"`);
  return song.songId;
};

const loadTrack = (meta, index) => getJson(songsterrTrackUrl(meta, index));

const listSong = (meta, measures) => {
  console.log(`${meta.artist} - ${meta.title} (song ${meta.songId})\n`);
  meta.tracks.forEach((t, i) =>
    console.log(
      `track ${i}: ${t.instrument} | ${t.name}${isSongsterrDrums(t) ? " (drums)" : ""}`,
    ),
  );
  console.log("\nSections (measure numbers as on the site):");
  listSections(measures).forEach((s) =>
    console.log(`  ${s.from + 1}: ${s.name}`),
  );
};

const pickRange = (measures) => {
  if (opts.section) {
    const section =
      findSection(measures, opts.section) ??
      fail(`No section "${opts.section}"`);
    return [section.from, section.to];
  }
  const from = Number(opts.from ?? 1) - 1;
  const to = Number(opts.to ?? measures.length) - 1;
  if (from < 0 || to >= measures.length || from > to) fail("Bad measure range");
  return [from, to];
};

// Folder and file names can't hold "/", so "Aeolian / Natural" sits in "Aeolian - Natural".
const toFileName = (text) =>
  text
    .replace(/\s*\/\s*/g, (match) => (match.trim() === match ? "-" : " - "))
    .replace(/[\\:*?"<>|]/g, "");

const main = async () => {
  if (opts.help) return console.log(HELP);
  const songId = await findSong();
  const meta = await getJson(`https://www.songsterr.com/api/meta/${songId}`);
  const playable = listPlayableTrackIndexes(meta);
  // the app plays no drums, so a drum track can't take any role
  const checkPlayable = (index) => {
    if (!meta.tracks[index]) fail(`No track ${index}`);
    if (!playable.includes(index))
      fail(`Track ${index} is drums or empty, the app can't play it`);
    return index;
  };
  const melodyIndex = checkPlayable(
    opts.track === undefined ? pickMelodyIndex(meta) : Number(opts.track),
  );
  const melodyTrack = await loadTrack(meta, melodyIndex);

  if (!opts.section && !opts.from && !opts.to) {
    listSong(meta, melodyTrack.measures);
    console.log("\nAdd --section or --from/--to to build the example.");
    return;
  }

  const [from, to] = pickRange(melodyTrack.measures);
  const popularBass = playable.includes(meta.popularTrackBass)
    ? meta.popularTrackBass
    : undefined;
  const bassNumber = opts["no-bass"]
    ? undefined
    : opts.bass === undefined
      ? popularBass
      : checkPlayable(Number(opts.bass));
  if (bassNumber === melodyIndex && opts.bass !== undefined)
    fail(`Track ${melodyIndex} can't be the melody and the bass`);
  const bassIndex = bassNumber === melodyIndex ? undefined : bassNumber;
  const bassTrack =
    bassIndex === undefined ? undefined : await loadTrack(meta, bassIndex);

  // a Songsterr track goes into the song once
  const taken = [melodyIndex, bassIndex];
  const extraIndexes =
    opts.extra === "all"
      ? playable.filter((i) => !taken.includes(i))
      : (opts.extra?.split(",").map(Number) ?? []);
  extraIndexes.forEach((index, i) => {
    checkPlayable(index);
    if (taken.includes(index) || extraIndexes.indexOf(index) !== i)
      fail(`Track ${index} is picked twice`);
  });
  const extraTracks = await Promise.all(
    extraIndexes.map(async (index) => {
      const program = songsterrProgram(meta.tracks[index]);
      return {
        track: await loadTrack(meta, index),
        name: songsterrTrackName(meta.tracks[index]),
        instrument:
          program === undefined ? undefined : getInstrumentForProgram(program),
      };
    }),
  );

  const tonic = opts.tonic ? NOTE_NAMES.indexOf(opts.tonic) : undefined;
  if (tonic === -1) fail(`Unknown tonic "${opts.tonic}"`);
  const scales = listScales(scalesMap, CHROMATIC);
  const scale = opts.scale
    ? (scales.find((s) => `${s.group}/${s.name}` === opts.scale) ??
      fail(`Unknown scale "${opts.scale}"`))
    : undefined;

  let result;
  try {
    result = convertSongsterr({
      meta,
      melodyTrack,
      bassTrack,
      extraTracks,
      from,
      to,
      scales,
      tonic,
      scale,
      band: opts.band,
      title: opts.title,
    });
  } catch (error) {
    fail(error.message);
  }
  const { song, changed, chordNames } = result;
  const { band, title } = song;

  console.log(`${band} - ${title}, measures ${from + 1}-${to + 1}`);
  console.log(
    `Tonic ${NOTE_NAMES[result.tonic]}, moved by ${result.shift} semitones to E`,
  );
  console.log(`Scale: ${result.scale.group} / ${result.scale.name}`);
  if (changed.size) {
    console.log("Notes moved into the scale:");
    changed.forEach((count, key) => console.log(`  ${key} (${count})`));
  }
  if (result.rounded) console.log("Some notes were rounded to 16ths.");
  if (!result.hasBass)
    console.log("No bass found, chords follow the lowest notes.");
  if (!chordNames.length) console.log("No chord fits the scale.");
  else console.log(`Chords: ${chordNames.join(" ")}`);
  console.log(`Tracks: ${song.tracks.map((t) => t.name).join(", ")}`);

  if (opts["dry-run"]) return;

  const dir = resolve(opts.dir ?? SONGS_DIR);
  const fileName = `${toFileName(band)} - ${toFileName(title)}.gp`;
  const file = join(dir, fileName);
  mkdirSync(dir, { recursive: true });
  const bytes = await writeGuitarPro(song, {
    getProgram: (track) =>
      track.instrument === undefined
        ? undefined
        : getProgramForInstrument(track.instrument),
  });
  writeFileSync(file, bytes);
  console.log(`Saved to ${file}`);
};

main();
