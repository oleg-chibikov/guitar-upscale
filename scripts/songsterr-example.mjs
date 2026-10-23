#!/usr/bin/env node
// Downloads a song from Songsterr and saves it as a Guitar Pro file in public/songs.
// The app builds every scale from E, so the song is moved to an E tonic first.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { CHROMATIC, scalesMap } from "../src/app/data/scaleDefinitions.ts";
import { writeGuitarPro } from "../src/app/engine/songs/gpWriter.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SONGS_DIR = resolve(ROOT, "public/songs");
const NOTE_NAMES = "C C# D D# E F F# G G# A A# B".split(" ");
const STANDARD = [64, 59, 55, 50, 45, 40];
const MAX_FRET = 24;
const LOWEST = STANDARD[5];
const HIGHEST = STANDARD[0] + MAX_FRET;
const E = 4;
const CHORD_TYPES = [
  ["m", [0, 3, 7]],
  ["", [0, 4, 7]],
  ["5", [0, 7]],
  ["dim", [0, 3, 6]],
];

const HELP = `Usage: pnpm songsterr "<artist and title>" [options]

Without --section or --from/--to it lists the tracks and sections and stops.

  --song-id N       Songsterr song id instead of the search
  --track N         melody track (default: the most popular one)
  --bass N          bass track (default: the most popular bass track)
  --no-bass         skip the bass and the chords
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

const pc = (pitch) => ((pitch % 12) + 12) % 12;

// Scale intervals in scaleDefinitions.ts count from E.
const inScale = (scale, pitch) => scale.notes.has(pc(pitch - E));

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) fail(`${response.status} for ${url}`);
  return response.json();
};

const findSong = async () => {
  if (opts["song-id"]) return Number(opts["song-id"]);
  const query = positionals.join(" ");
  if (!query) fail(HELP);
  const songs = await getJson(
    `https://www.songsterr.com/api/songs?pattern=${encodeURIComponent(query)}`
  );
  const song = songs.find((s) => s.hasPlayer) ?? fail(`No song for "${query}"`);
  return song.songId;
};

const loadTrack = (meta, index) =>
  getJson(
    `https://dqsljvtekg760.cloudfront.net/${meta.songId}/${meta.revisionId}/${meta.image}/${index}.json`
  );

// Same steps as src/app/data/tempo.ts, so the tempo slider can show the value.
const tempoSteps = () => {
  const steps = [];
  for (let i = 25; i < 80; i += 5) steps.push(i);
  for (let i = 80; i < 180; i++) steps.push(i);
  for (let i = 180; i < 300; i += 5) steps.push(i);
  for (let i = 300; i < 400; i += 25) steps.push(i);
  for (let i = 400; i <= 500; i += 50) steps.push(i);
  return steps;
};

const snapTempo = (tempo) =>
  tempoSteps().reduce((best, step) =>
    Math.abs(step - tempo) < Math.abs(best - tempo) ? step : best
  );

// The index names the scale the notes fit best, which may be smaller than this one
const listScales = () =>
  Array.from(scalesMap.entries()).flatMap(([group, scales]) =>
    Array.from(scales.entries())
      .filter(([name]) => name !== CHROMATIC)
      .map(([name, intervals]) => ({ group, name, notes: new Set([0, ...intervals]) }))
  );

const listSong = (meta, measures) => {
  console.log(`${meta.artist} - ${meta.title} (song ${meta.songId})\n`);
  meta.tracks.forEach((t, i) =>
    console.log(`track ${i}: ${t.instrument} | ${t.name}`)
  );
  console.log("\nSections (measure numbers as on the site):");
  measures.forEach((m, i) => {
    if (m.marker?.text) console.log(`  ${i + 1}: ${m.marker.text}`);
  });
};

const pickRange = (measures) => {
  if (opts.section) {
    const wanted = opts.section.toLowerCase();
    const name = (m) => m.marker?.text?.trim().toLowerCase();
    const exact = measures.findIndex((m) => name(m) === wanted);
    const start =
      exact >= 0 ? exact : measures.findIndex((m) => name(m)?.includes(wanted));
    if (start < 0) fail(`No section "${opts.section}"`);
    let end = start + 1;
    while (end < measures.length && !measures[end].marker) end++;
    return [start, end - 1];
  }
  const from = Number(opts.from ?? 1) - 1;
  const to = Number(opts.to ?? measures.length) - 1;
  if (from < 0 || to >= measures.length || from > to) fail("Bad measure range");
  return [from, to];
};

// Returns notes as { tick, pitch, string } with one tick per 16th note.
const readNotes = (track, from, to) => {
  const notes = [];
  const barStarts = [];
  let tick = 0;
  let rounded = false;
  const capo = track.capo ?? 0;
  let signature = [4, 4];
  for (let i = 0; i < from; i++) signature = track.measures[i].signature ?? signature;
  for (let i = from; i <= to; i++) {
    signature = track.measures[i].signature ?? signature;
    const barStart = tick;
    barStarts.push(Math.round(tick));
    for (const beat of track.measures[i].voices[0].beats) {
      const start = Math.round(tick);
      if (Math.abs(start - tick) > 1e-9) rounded = true;
      for (const note of beat.notes) {
        if (note.rest || note.tie || note.dead) continue;
        notes.push({
          tick: start,
          pitch: track.tuning[note.string] + note.fret + capo,
          string: note.string,
        });
      }
      tick += (16 * beat.duration[0]) / beat.duration[1];
    }
    // A rest over the whole bar is stored as a whole note in any time signature.
    tick = barStart + (16 * signature[0]) / signature[1];
  }
  return { notes, barStarts, length: Math.round(tick), rounded };
};

// Without a bass track the lowest note of each bar stands in for the bass.
const lowestNotes = (notes, barStarts) =>
  barStarts
    .map((start, i) => {
      const end = barStarts[i + 1] ?? Infinity;
      return notes
        .filter((n) => n.tick >= start && n.tick < end)
        .sort((a, b) => a.pitch - b.pitch)[0];
    })
    .filter(Boolean);

const guessTonic = (notes) => {
  const weight = new Array(12).fill(0);
  notes.forEach((n, i) => {
    const next = notes[i + 1]?.tick ?? n.tick + 4;
    weight[pc(n.pitch)] += Math.max(1, next - n.tick);
  });
  const total = weight.reduce((a, b) => a + b, 0);
  weight[pc(notes[0].pitch)] += total * 0.2;
  weight[pc(notes[notes.length - 1].pitch)] += total * 0.2;
  return weight.indexOf(Math.max(...weight));
};

// Picks the shift to an E tonic that keeps the most melody notes on the neck.
const pickShift = (tonic, melody) => {
  const up = pc(E - tonic);
  const outside = (shift) =>
    melody.filter((n) => n.pitch + shift < LOWEST || n.pitch + shift > HIGHEST)
      .length;
  return [up, up - 12, up + 12, up - 24, up + 24].sort(
    (a, b) => outside(a) - outside(b) || Math.abs(a) - Math.abs(b)
  )[0];
};

// A changed melody note is easier to hear than a changed bass note.
const MELODY_WEIGHT = 3;

const pickScale = (scales, melody, bass) => {
  const counts = new Array(12).fill(0);
  melody.forEach((n) => (counts[pc(n.pitch - E)] += MELODY_WEIGHT));
  bass.forEach((n) => counts[pc(n.pitch - E)]++);
  const missed = (s) =>
    counts.reduce((sum, c, i) => sum + (s.notes.has(i) ? 0 : c), 0);
  return [...scales].sort(
    (a, b) => missed(a) - missed(b) || a.notes.size - b.notes.size
  )[0];
};

const fitToScale = (pitch, scale) => {
  for (const step of [0, -1, 1, -2, 2]) {
    if (inScale(scale, pitch + step)) return pitch + step;
  }
  return pitch;
};

const fretOn = (pitch, string) => pitch - STANDARD[string];
const fits = (pitch, string) =>
  fretOn(pitch, string) >= 0 && fretOn(pitch, string) <= MAX_FRET;

const placeMelody = (notes, sourceTuning) => {
  let lastFret = 5;
  return notes.map((n) => {
    let pitch = n.pitch;
    while (pitch < LOWEST) pitch += 12;
    while (pitch > HIGHEST) pitch -= 12;
    let string = n.string;
    if (sourceTuning.length !== 6 || !fits(pitch, string)) {
      string = [0, 1, 2, 3, 4, 5]
        .filter((s) => fits(pitch, s))
        .sort(
          (a, b) =>
            Math.abs(fretOn(pitch, a) - lastFret) -
              Math.abs(fretOn(pitch, b) - lastFret) || a - b
        )[0];
    }
    lastFret = fretOn(pitch, string);
    return { ...n, pitch, string, fret: lastFret };
  });
};

// One bass note per beat, and the same note isn't repeated within a bar.
const simplifyBass = (notes, barStarts) => {
  const result = [];
  let lastBeat = -1;
  let lastBar = -1;
  let lastPitch;
  for (const n of [...notes].sort((a, b) => a.tick - b.tick || a.pitch - b.pitch)) {
    const beat = Math.floor(n.tick / 4);
    if (beat === lastBeat) continue;
    const bar = barStarts.filter((s) => s <= n.tick).length - 1;
    if (bar === lastBar && n.pitch === lastPitch) continue;
    result.push(n);
    lastBeat = beat;
    lastBar = bar;
    lastPitch = n.pitch;
  }
  return result;
};

const placeBass = (notes) =>
  notes.map((n) => {
    let pitch = n.pitch;
    while (pitch < LOWEST) pitch += 12;
    while (pitch > STANDARD[3] + 12) pitch -= 12;
    const string = [5, 4, 3]
      .filter((s) => fretOn(pitch, s) >= 0)
      .sort((a, b) => fretOn(pitch, a) - fretOn(pitch, b))[0];
    return { ...n, pitch, string, fret: fretOn(pitch, string) };
  });

// A chord per half bar, built on the bass note and kept inside the scale.
const pickChords = (bass, melody, barStarts, length, scale) => {
  const chords = [];
  const overall = new Array(12).fill(0);
  melody.forEach((n) => overall[pc(n.pitch)]++);
  const halves = barStarts.flatMap((start, i) => {
    const end = barStarts[i + 1] ?? length;
    return [start, start + Math.floor((end - start) / 2)];
  });
  halves.forEach((start, i) => {
    const end = halves[i + 1] ?? length;
    const inHalf = bass.filter((n) => n.tick >= start && n.tick < end);
    if (!inHalf.length) return;
    // The root is the bass note that sounds longest in this half bar.
    const held = new Map();
    inHalf.forEach((n) => {
      const next = bass.find((x) => x.tick > n.tick)?.tick ?? end;
      held.set(pc(n.pitch), (held.get(pc(n.pitch)) ?? 0) + Math.min(next, end) - n.tick);
    });
    const rootPc = [...held.keys()].sort((a, b) => held.get(b) - held.get(a))[0];
    const root = inHalf.find((n) => pc(n.pitch) === rootPc);
    const heard = melody.filter((n) => n.tick >= start && n.tick < end);
    let best;
    for (const [suffix, intervals] of CHORD_TYPES) {
      const tones = intervals.map((x) => pc(root.pitch + x));
      if (!tones.every((t) => inScale(scale, t))) continue;
      const score = heard.filter((n) => tones.includes(pc(n.pitch))).length;
      // On a tie the chord whose notes the whole melody uses more wins.
      const tieBreak = tones.reduce((sum, t) => sum + overall[t], 0);
      if (
        !best ||
        score > best.score ||
        (score === best.score && tieBreak > best.tieBreak)
      )
        best = { suffix, score, tieBreak };
    }
    if (!best) return;
    const name = NOTE_NAMES[pc(root.pitch)] + best.suffix;
    if (chords.at(-1)?.name !== name) chords.push({ tick: root.tick, name });
  });
  return chords;
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
  const melodyIndex = Number(opts.track ?? meta.popularTrack ?? 0);
  const melodyTrack = await loadTrack(meta, melodyIndex);

  if (!opts.section && !opts.from && !opts.to) {
    listSong(meta, melodyTrack.measures);
    console.log("\nAdd --section or --from/--to to build the example.");
    return;
  }

  const [from, to] = pickRange(melodyTrack.measures);
  const melodyRaw = readNotes(melodyTrack, from, to);
  if (!melodyRaw.notes.length) fail("The melody track is empty in this range");

  const bassIndex = opts["no-bass"] ? undefined : opts.bass ?? meta.popularTrackBass;
  const bassRaw =
    bassIndex === undefined || bassIndex === null
      ? undefined
      : readNotes(await loadTrack(meta, Number(bassIndex)), from, to);
  const bassNotes = bassRaw?.notes.length
    ? simplifyBass(bassRaw.notes, melodyRaw.barStarts)
    : [];

  const tonic = opts.tonic
    ? NOTE_NAMES.indexOf(opts.tonic)
    : guessTonic(
        bassNotes.length
          ? bassNotes
          : lowestNotes(melodyRaw.notes, melodyRaw.barStarts)
      );
  if (tonic < 0) fail(`Unknown tonic "${opts.tonic}"`);
  const shift = pickShift(tonic, melodyRaw.notes);
  const shifted = (n) => ({ ...n, pitch: n.pitch + shift });

  const scales = listScales();
  const scale = opts.scale
    ? scales.find((s) => `${s.group}/${s.name}` === opts.scale) ??
      fail(`Unknown scale "${opts.scale}"`)
    : pickScale(scales, melodyRaw.notes.map(shifted), bassNotes.map(shifted));
  const changed = new Map();
  const moveToScale = (n) => {
    const pitch = fitToScale(n.pitch + shift, scale);
    if (pitch !== n.pitch + shift) {
      const key = `${NOTE_NAMES[pc(n.pitch + shift)]} -> ${NOTE_NAMES[pc(pitch)]}`;
      changed.set(key, (changed.get(key) ?? 0) + 1);
    }
    return { ...n, pitch };
  };

  const melody = placeMelody(melodyRaw.notes.map(moveToScale), melodyTrack.tuning);
  const bass = placeBass(bassNotes.map(moveToScale));
  const chordRoots = (
    bass.length
      ? bassRaw.notes
      : lowestNotes(melodyRaw.notes, melodyRaw.barStarts)
  ).map((n) => ({ ...n, pitch: fitToScale(n.pitch + shift, scale) }));
  const chords = pickChords(
    chordRoots,
    melody,
    melodyRaw.barStarts,
    melodyRaw.length,
    scale
  );

  const tempos = melodyTrack.automations?.tempo ?? [];
  const bpm =
    tempos.filter((a) => a.measure <= from).at(-1)?.bpm ?? tempos[0]?.bpm ?? 120;

  // One step is a 16th note, 4 app ticks. A song above 180 BPM gets half the tempo and 32nds instead
  const isFast = bpm > 180;
  const TICKS_IN_STEP = isFast ? 2 : 4;
  const tempo = snapTempo(isFast ? bpm / 2 : bpm);
  const tuning = STANDARD.map((midi) => ({ octave: Math.floor(midi / 12), note: midi % 12 }));
  const tabTrack = (name, notes) => ({
    name,
    tuning,
    tabNotes: notes.map((n) => ({ tick: n.tick * TICKS_IN_STEP, string: n.string, fret: n.fret })),
    pitchNotes: [],
    chords: [],
  });
  const tracks = [tabTrack("Melody", melody)];
  if (bass.length) tracks.push(tabTrack("Melody 2", bass));
  if (chords.length)
    tracks.push({
      ...tabTrack("Chords", []),
      chords: chords.map((c) => ({ tick: c.tick * TICKS_IN_STEP, name: c.name })),
    });

  const band = opts.band ?? meta.artist;
  const title = opts.title ?? meta.title;

  console.log(`${band} - ${title}, measures ${from + 1}-${to + 1}`);
  console.log(`Tonic ${NOTE_NAMES[tonic]}, moved by ${shift} semitones to E`);
  console.log(`Scale: ${scale.group} / ${scale.name}`);
  if (changed.size) {
    console.log("Notes moved into the scale:");
    changed.forEach((count, key) => console.log(`  ${key} (${count})`));
  }
  if (melodyRaw.rounded) console.log("Some notes were rounded to 16ths.");
  if (!bass.length) console.log("No bass found, chords follow the lowest notes.");
  if (!chords.length) console.log("No chord fits the scale.");

  if (chords.length) console.log(`Chords: ${chords.map((c) => c.name).join(" ")}`);

  if (opts["dry-run"]) return;

  const dir = resolve(opts.dir ?? SONGS_DIR);
  const fileName = `${toFileName(band)} - ${toFileName(title)}.gp`;
  const file = join(dir, fileName);
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, await writeGuitarPro({ band, title, tempo, root: E, tracks }));
  console.log(`Saved to ${file}`);
  if (dir === SONGS_DIR) {
    execFileSync(process.execPath, [...process.execArgv, resolve(ROOT, "scripts/build-song-index.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
};

main();
