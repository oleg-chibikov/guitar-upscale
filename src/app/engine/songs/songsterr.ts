// Turns Songsterr tracks into a Song moved to an E tonic, since the app builds every scale from E.
// It imports only types, so the scripts can load it with Node's type stripping.
import type { Instrument } from "../../data/instruments";
import type { Note, OctaveNote } from "../../data/notes";
import type { Song, SongTrack } from "../../data/song";

export type SongsterrSearchResult = {
  songId: number;
  artist: string;
  title: string;
};

export type SongsterrTrackInfo = {
  // a General MIDI program, or 1024 for drums
  instrumentId?: number;
  instrument: string;
  name: string;
  isEmpty?: boolean;
};

export type SongsterrMeta = {
  songId: number;
  revisionId: number;
  image: string;
  artist: string;
  title: string;
  tracks: SongsterrTrackInfo[];
  popularTrack?: number;
  popularTrackBass?: number | null;
};

type SongsterrNote = {
  string: number;
  fret: number;
  rest?: boolean;
  tie?: boolean;
  dead?: boolean;
};

type SongsterrBeat = { duration: [number, number]; notes: SongsterrNote[] };

export type SongsterrMeasure = {
  signature?: [number, number];
  marker?: { text?: string };
  voices: { beats: SongsterrBeat[] }[];
};

export type SongsterrTrack = {
  tuning: number[];
  capo?: number;
  measures: SongsterrMeasure[];
  automations?: { tempo?: { measure: number; bpm: number }[] };
};

// A measure range is 0-based and inclusive on both ends.
export type SongsterrSection = { name: string; from: number; to: number };

export type ScaleOption = { group: string; name: string; notes: Set<number> };

type RawNote = { tick: number; pitch: number; string: number };
type PlacedNote = RawNote & { fret: number };
type ChordMark = { tick: number; name: string };

const SONGSTERR_API = "https://www.songsterr.com/api";

export const songsterrSearchUrl = (pattern: string) =>
  `${SONGSTERR_API}/songs?pattern=${encodeURIComponent(pattern)}`;

export const songsterrMetaUrl = (songId: number) =>
  `${SONGSTERR_API}/meta/${songId}`;

// The track files allow any origin, so the browser loads them directly.
export const songsterrTrackUrl = (meta: SongsterrMeta, index: number) =>
  `https://dqsljvtekg760.cloudfront.net/${meta.songId}/${meta.revisionId}/${meta.image}/${index}.json`;

const DRUMS_INSTRUMENT_ID = 1024;

export const isSongsterrDrums = (info: SongsterrTrackInfo) =>
  info.instrumentId === DRUMS_INSTRUMENT_ID || /drum/i.test(info.instrument);

// Tracks a song can take on top of the melody and the bass: drums and empty tracks stay out.
export const listExtraTrackIndexes = (meta: SongsterrMeta) =>
  meta.tracks.flatMap((info, index) =>
    isSongsterrDrums(info) || info.isEmpty === true ? [] : [index],
  );

// The General MIDI program of a track, undefined for drums.
export const songsterrProgram = (info: SongsterrTrackInfo) =>
  info.instrumentId !== undefined && info.instrumentId < 128
    ? info.instrumentId
    : undefined;

// A name starting with "Melody" or "Chords" would change how the app plays the track.
export const songsterrTrackName = (info: SongsterrTrackInfo) => {
  const name = info.name.trim() || info.instrument;
  return /^\s*(melody|chords)/i.test(name)
    ? `${info.instrument} ${name}`
    : name;
};

export const NOTE_NAMES = "C C# D D# E F F# G G# A A# B".split(" ");
const STANDARD = [64, 59, 55, 50, 45, 40];
const MAX_FRET = 24;
const LOWEST = STANDARD[5];
const HIGHEST = STANDARD[0] + MAX_FRET;
const E = 4;
const CHORD_TYPES: [string, number[]][] = [
  ["m", [0, 3, 7]],
  ["", [0, 4, 7]],
  ["5", [0, 7]],
  ["dim", [0, 3, 6]],
];

const pc = (pitch: number) => ((pitch % 12) + 12) % 12;

// Scale intervals in scaleDefinitions.ts count from E.
const inScale = (scale: ScaleOption, pitch: number) =>
  scale.notes.has(pc(pitch - E));

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

const snapTempo = (tempo: number) =>
  tempoSteps().reduce((best, step) =>
    Math.abs(step - tempo) < Math.abs(best - tempo) ? step : best,
  );

// The index names the scale the notes fit best, which may be smaller than this one
export const listScales = (
  scalesMap: ReadonlyMap<string, ReadonlyMap<string, readonly number[]>>,
  chromatic: string,
): ScaleOption[] =>
  Array.from(scalesMap.entries()).flatMap(([group, scales]) =>
    Array.from(scales.entries())
      .filter(([name]) => name !== chromatic)
      .map(([name, intervals]) => ({
        group,
        name,
        notes: new Set([0, ...intervals]),
      })),
  );

// A section runs from its marker to the measure before the next marker.
export const listSections = (
  measures: SongsterrMeasure[],
): SongsterrSection[] => {
  const starts = measures.flatMap((m, i) =>
    (m.marker?.text?.trim() ?? "") !== "" ? [i] : [],
  );
  return starts.map((from, i) => ({
    name: measures[from].marker?.text?.trim() ?? "",
    from,
    to: (starts[i + 1] ?? measures.length) - 1,
  }));
};

export const findSection = (measures: SongsterrMeasure[], wanted: string) => {
  const sections = listSections(measures);
  const name = wanted.trim().toLowerCase();
  return (
    sections.find((s) => s.name.toLowerCase() === name) ??
    sections.find((s) => s.name.toLowerCase().includes(name))
  );
};

// Returns notes with one tick per 16th note.
const readNotes = (track: SongsterrTrack, from: number, to: number) => {
  const notes: RawNote[] = [];
  const barStarts: number[] = [];
  let tick = 0;
  let rounded = false;
  const capo = track.capo ?? 0;
  let signature: [number, number] = [4, 4];
  for (let i = 0; i < from; i++)
    signature = track.measures[i]?.signature ?? signature;
  for (let i = from; i <= to; i++) {
    const measure = track.measures[i];
    signature = measure?.signature ?? signature;
    const barStart = tick;
    barStarts.push(Math.round(tick));
    for (const beat of measure?.voices[0]?.beats ?? []) {
      const start = Math.round(tick);
      if (Math.abs(start - tick) > 1e-9) rounded = true;
      for (const note of beat.notes) {
        if (note.rest === true || note.tie === true || note.dead === true)
          continue;
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
const lowestNotes = (notes: RawNote[], barStarts: number[]) =>
  barStarts
    .map((start, i) => {
      const end = barStarts[i + 1] ?? Infinity;
      return notes
        .filter((n) => n.tick >= start && n.tick < end)
        .sort((a, b) => a.pitch - b.pitch)[0];
    })
    .filter(Boolean);

const guessTonic = (notes: RawNote[]) => {
  const weight = new Array<number>(12).fill(0);
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
const pickShift = (tonic: number, melody: RawNote[]) => {
  const up = pc(E - tonic);
  const outside = (shift: number) =>
    melody.filter((n) => n.pitch + shift < LOWEST || n.pitch + shift > HIGHEST)
      .length;
  return [up, up - 12, up + 12, up - 24, up + 24].sort(
    (a, b) => outside(a) - outside(b) || Math.abs(a) - Math.abs(b),
  )[0];
};

// A changed melody note is easier to hear than a changed bass note.
const MELODY_WEIGHT = 3;

const pickScale = (
  scales: ScaleOption[],
  melody: RawNote[],
  others: RawNote[],
) => {
  const counts = new Array<number>(12).fill(0);
  melody.forEach((n) => (counts[pc(n.pitch - E)] += MELODY_WEIGHT));
  others.forEach((n) => counts[pc(n.pitch - E)]++);
  const missed = (s: ScaleOption) =>
    counts.reduce((sum, c, i) => sum + (s.notes.has(i) ? 0 : c), 0);
  return [...scales].sort(
    (a, b) => missed(a) - missed(b) || a.notes.size - b.notes.size,
  )[0];
};

const fitToScale = (pitch: number, scale: ScaleOption) => {
  for (const step of [0, -1, 1, -2, 2]) {
    if (inScale(scale, pitch + step)) return pitch + step;
  }
  return pitch;
};

const fretOn = (pitch: number, string: number) => pitch - STANDARD[string];
const fits = (pitch: number, string: number) =>
  fretOn(pitch, string) >= 0 && fretOn(pitch, string) <= MAX_FRET;

// Notes struck together get different strings. A chord note with no free string drops out.
const placeMelody = (notes: RawNote[], sourceTuning: number[]) => {
  let lastFret = 5;
  const taken = new Map<number, Set<number>>();
  return notes.flatMap((n): PlacedNote[] => {
    let pitch = n.pitch;
    while (pitch < LOWEST) pitch += 12;
    while (pitch > HIGHEST) pitch -= 12;
    const used = taken.get(n.tick) ?? new Set<number>();
    const isFree = (s: number) => fits(pitch, s) && !used.has(s);
    let string: number | undefined = n.string;
    if (sourceTuning.length !== 6 || !isFree(string)) {
      string = [0, 1, 2, 3, 4, 5]
        .filter(isFree)
        .sort(
          (a, b) =>
            Math.abs(fretOn(pitch, a) - lastFret) -
              Math.abs(fretOn(pitch, b) - lastFret) || a - b,
        )[0];
    }
    if (string === undefined) return [];
    used.add(string);
    taken.set(n.tick, used);
    lastFret = fretOn(pitch, string);
    return [{ ...n, pitch, string, fret: lastFret }];
  });
};

// One bass note per beat, and the same note isn't repeated within a bar.
const simplifyBass = (notes: RawNote[], barStarts: number[]) => {
  const result: RawNote[] = [];
  let lastBeat = -1;
  let lastBar = -1;
  let lastPitch: number | undefined;
  for (const n of [...notes].sort(
    (a, b) => a.tick - b.tick || a.pitch - b.pitch,
  )) {
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

const placeBass = (notes: RawNote[]) =>
  notes.map((n): PlacedNote => {
    let pitch = n.pitch;
    while (pitch < LOWEST) pitch += 12;
    while (pitch > STANDARD[3] + 12) pitch -= 12;
    const string = [5, 4, 3]
      .filter((s) => fretOn(pitch, s) >= 0)
      .sort((a, b) => fretOn(pitch, a) - fretOn(pitch, b))[0];
    return { ...n, pitch, string, fret: fretOn(pitch, string) };
  });

// A chord per half bar, built on the bass note and kept inside the scale.
const pickChords = (
  bass: RawNote[],
  melody: RawNote[],
  barStarts: number[],
  length: number,
  scale: ScaleOption,
) => {
  const chords: ChordMark[] = [];
  const overall = new Array<number>(12).fill(0);
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
    const held = new Map<number, number>();
    inHalf.forEach((n) => {
      const next = bass.find((x) => x.tick > n.tick)?.tick ?? end;
      held.set(
        pc(n.pitch),
        (held.get(pc(n.pitch)) ?? 0) + Math.min(next, end) - n.tick,
      );
    });
    const rootPc = [...held.keys()].sort(
      (a, b) => (held.get(b) ?? 0) - (held.get(a) ?? 0),
    )[0];
    const root = inHalf.find((n) => pc(n.pitch) === rootPc);
    if (!root) return;
    const heard = melody.filter((n) => n.tick >= start && n.tick < end);
    let best: { suffix: string; score: number; tieBreak: number } | undefined;
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

export type SongsterrExtraTrack = {
  track: SongsterrTrack;
  name: string;
  // undefined plays the track with the instrument picked in the settings
  instrument?: Instrument;
};

export type SongsterrConvertOptions = {
  meta: SongsterrMeta;
  melodyTrack: SongsterrTrack;
  bassTrack?: SongsterrTrack;
  // more tracks that go in whole, each with its own instrument
  extraTracks?: SongsterrExtraTrack[];
  from: number;
  to: number;
  scales: ScaleOption[];
  // pitch class of the source tonic, guessed from the bass when left out
  tonic?: number;
  scale?: ScaleOption;
  band?: string;
  title?: string;
};

export type SongsterrConvertResult = {
  song: Song;
  tonic: number;
  shift: number;
  scale: ScaleOption;
  // "C -> C#" and how many notes moved that way to fit the scale
  changed: Map<string, number>;
  rounded: boolean;
  hasBass: boolean;
  chordNames: string[];
};

export const convertSongsterr = ({
  meta,
  melodyTrack,
  bassTrack,
  extraTracks = [],
  from,
  to,
  scales,
  tonic: wantedTonic,
  scale: wantedScale,
  band = meta.artist,
  title = meta.title,
}: SongsterrConvertOptions): SongsterrConvertResult => {
  const melodyRaw = readNotes(melodyTrack, from, to);
  if (!melodyRaw.notes.length) {
    throw new Error("The melody track is empty in these measures");
  }
  const bassRaw = bassTrack ? readNotes(bassTrack, from, to) : undefined;
  const bassNotes =
    bassRaw !== undefined && bassRaw.notes.length > 0
      ? simplifyBass(bassRaw.notes, melodyRaw.barStarts)
      : [];
  const extrasRaw = extraTracks.map((extra) => ({
    ...extra,
    notes: readNotes(extra.track, from, to).notes,
  }));

  const tonic =
    wantedTonic ??
    guessTonic(
      bassNotes.length
        ? bassNotes
        : lowestNotes(melodyRaw.notes, melodyRaw.barStarts),
    );
  const shift = pickShift(tonic, melodyRaw.notes);
  const shifted = (n: RawNote) => ({ ...n, pitch: n.pitch + shift });

  const scale =
    wantedScale ??
    pickScale(
      scales,
      melodyRaw.notes.map(shifted),
      [...bassNotes, ...extrasRaw.flatMap((extra) => extra.notes)].map(shifted),
    );
  const changed = new Map<string, number>();
  const moveToScale = (n: RawNote) => {
    const pitch = fitToScale(n.pitch + shift, scale);
    if (pitch !== n.pitch + shift) {
      const key = `${NOTE_NAMES[pc(n.pitch + shift)]} -> ${NOTE_NAMES[pc(pitch)]}`;
      changed.set(key, (changed.get(key) ?? 0) + 1);
    }
    return { ...n, pitch };
  };

  const melody = placeMelody(
    melodyRaw.notes.map(moveToScale),
    melodyTrack.tuning,
  );
  const bass = placeBass(bassNotes.map(moveToScale));
  const chordRoots = (
    bass.length && bassRaw
      ? bassRaw.notes
      : lowestNotes(melodyRaw.notes, melodyRaw.barStarts)
  ).map((n) => ({ ...n, pitch: fitToScale(n.pitch + shift, scale) }));
  const chords = pickChords(
    chordRoots,
    melody,
    melodyRaw.barStarts,
    melodyRaw.length,
    scale,
  );

  const tempos = melodyTrack.automations?.tempo ?? [];
  const bpm =
    tempos.filter((a) => a.measure <= from).at(-1)?.bpm ??
    tempos[0]?.bpm ??
    120;

  // One step is a 16th note, 4 app ticks. A song above 180 BPM gets half the tempo and 32nds instead
  const isFast = bpm > 180;
  const ticksInStep = isFast ? 2 : 4;
  const tempo = snapTempo(isFast ? bpm / 2 : bpm);
  const tuning: OctaveNote[] = STANDARD.map((midi) => ({
    octave: Math.floor(midi / 12),
    note: (midi % 12) as Note,
  }));
  const tabTrack = (
    name: string,
    notes: PlacedNote[],
    instrument?: Instrument,
  ): SongTrack => ({
    name,
    instrument,
    tuning,
    tabNotes: notes.map((n) => ({
      tick: n.tick * ticksInStep,
      string: n.string,
      fret: n.fret,
    })),
    pitchNotes: [],
    chords: [],
  });
  const tracks = [tabTrack("Melody", melody)];
  if (bass.length) tracks.push(tabTrack("Melody 2", bass));
  const usedNames = new Set(tracks.map((t) => t.name));
  extrasRaw.forEach((extra) => {
    const notes = placeMelody(extra.notes.map(moveToScale), extra.track.tuning);
    if (!notes.length) return;
    // two Songsterr tracks can share a name, such as two unnamed violins
    let name = extra.name;
    for (let i = 2; usedNames.has(name); i++) name = `${extra.name} ${i}`;
    usedNames.add(name);
    tracks.push(tabTrack(name, notes, extra.instrument));
  });
  if (chords.length)
    tracks.push({
      ...tabTrack("Chords", []),
      chords: chords.map((c) => ({
        tick: c.tick * ticksInStep,
        name: c.name,
      })),
    });

  return {
    song: { band, title, tempo, root: E as Note, tracks },
    tonic,
    shift,
    scale,
    changed,
    rounded: melodyRaw.rounded,
    hasBass: bass.length > 0,
    chordNames: chords.map((c) => c.name),
  };
};
