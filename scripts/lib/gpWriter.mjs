// Writes a song as a Guitar Pro 7 file the app can read.
// Time is counted in steps of half a beat, strings from 0 for the highest one.
import * as at from "@coderline/alphatab";

const m = at.model;
const STANDARD = [64, 59, 55, 50, 45, 40];
const STEPS_IN_BAR = 8;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHORD_INTERVALS = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  5: [0, 7],
  7: [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

// Frets from the highest string, -1 for a muted string. Guitar Pro plays them, the app reads only the name
export const voiceChord = (name) => {
  const root = name[1] === "#" ? name.slice(0, 2) : name[0];
  const suffix = name.slice(root.length);
  const rootPc = NOTE_NAMES.indexOf(root);
  const intervals = CHORD_INTERVALS[suffix];
  if (rootPc < 0 || !intervals) throw new Error(`No shape for the chord ${name}`);
  const tones = new Set(intervals.map((i) => (rootPc + i) % 12));
  const low = [...STANDARD].reverse();
  const frets = Array(6).fill(-1);
  if (suffix === "5") {
    const onE = (rootPc - 4 + 12) % 12;
    const onA = (rootPc - 9 + 12) % 12;
    const string = onE <= onA ? 0 : 1;
    const fret = Math.min(onE, onA);
    frets[string] = fret;
    frets[string + 1] = fret + 2;
    frets[string + 2] = fret + 2;
    return frets.reverse();
  }
  const bass = [0, 1, 2].find((s) => [0, 1, 2, 3, 4].some((f) => (low[s] + f) % 12 === rootPc));
  frets[bass] = [0, 1, 2, 3, 4].find((f) => (low[bass] + f) % 12 === rootPc);
  for (let s = bass + 1; s < 6; s++) {
    frets[s] = [0, 1, 2, 3, 4].find((f) => tones.has((low[s] + f) % 12)) ?? -1;
  }
  return frets.reverse();
};

const DURATIONS = [
  [8, m.Duration.Whole],
  [4, m.Duration.Half],
  [2, m.Duration.Quarter],
  [1, m.Duration.Eighth],
];

// Splits a run of steps inside one bar into note values
const splitSteps = (steps, position) => {
  const parts = [];
  while (steps > 0) {
    const [size, duration] =
      DURATIONS.find(([s]) => s <= steps && position % s === 0) ?? DURATIONS[3];
    parts.push(duration);
    steps -= size;
    position += size;
  }
  return parts;
};

const addVoice = (bar, events, barStart, barEnd, pickupOffset) => {
  const voice = new m.Voice();
  bar.addVoice(voice);
  const onsets = [...events.keys()].filter((s) => s > barStart && s < barEnd).sort((a, b) => a - b);
  const points = [barStart, ...onsets, barEnd];
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const notes = events.get(from);
    splitSteps(points[i + 1] - from, from - barStart + pickupOffset).forEach((duration, index) => {
      const beat = new m.Beat();
      beat.duration = duration;
      if (index === 0 && notes) {
        for (const n of notes) {
          const note = new m.Note();
          // alphaTab counts strings from the lowest one
          note.string = STANDARD.length - n.string;
          note.fret = n.fret;
          beat.addNote(note);
          if (n.chord) beat.chordId = n.chord;
        }
      }
      voice.addBeat(beat);
    });
  }
};

/**
 * @param song {{ band: string, title: string, tempo: number, pickup?: number,
 *   tracks: { name: string, program: number,
 *     notes?: { step: number, string: number, fret: number }[],
 *     chords?: { step: number, name: string }[] }[] }}
 * Name a track "Chords" to play it as chords, "Melody" to play it with the instrument picked in the app.
 */
export const writeGuitarPro = (song) => {
  const settings = new at.Settings();
  const score = new m.Score();
  score.artist = song.band;
  score.title = song.title;
  const pickup = song.pickup ?? 0;
  const steps = song.tracks.flatMap((t) => [...(t.notes ?? []), ...(t.chords ?? [])].map((e) => e.step));
  const lastStep = Math.max(0, ...steps) + 1;
  const barStarts = [0];
  for (let s = pickup || STEPS_IN_BAR; s < lastStep; s += STEPS_IN_BAR) barStarts.push(s);
  const barEnd = (index) => (index === 0 && pickup ? pickup : barStarts[index] + STEPS_IN_BAR);

  barStarts.forEach((_, index) => {
    const masterBar = new m.MasterBar();
    masterBar.timeSignatureNumerator = 4;
    masterBar.timeSignatureDenominator = 4;
    if (index === 0) {
      masterBar.isAnacrusis = pickup > 0;
      masterBar.tempoAutomations.push(m.Automation.buildTempoAutomation(false, 0, song.tempo, 2));
    }
    score.addMasterBar(masterBar);
  });

  song.tracks.forEach((part, partIndex) => {
    const track = new m.Track();
    track.name = part.name;
    track.shortName = part.name.slice(0, 10);
    track.playbackInfo.program = part.program;
    track.playbackInfo.primaryChannel = partIndex * 2;
    track.playbackInfo.secondaryChannel = partIndex * 2 + 1;
    const staff = new m.Staff();
    staff.showTablature = true;
    staff.showStandardNotation = true;
    staff.stringTuning.tunings = [...STANDARD];
    track.addStaff(staff);
    score.addTrack(track);

    // a second voice takes notes that land on a busy string
    const voices = [new Map()];
    for (const n of part.notes ?? []) {
      let layer = voices.find((v) => !(v.get(n.step) ?? []).some((x) => x.string === n.string));
      if (!layer) {
        layer = new Map();
        voices.push(layer);
      }
      layer.set(n.step, [...(layer.get(n.step) ?? []), n]);
    }
    for (const c of part.chords ?? []) {
      if (!staff.chords?.has(c.name)) {
        const chord = new m.Chord();
        chord.name = c.name;
        chord.strings = voiceChord(c.name);
        chord.showDiagram = true;
        chord.showName = true;
        staff.addChord(c.name, chord);
      }
      const frets = staff.chords.get(c.name).strings;
      voices[0].set(
        c.step,
        frets.map((fret, string) => ({ string, fret, chord: c.name })).filter((x) => x.fret >= 0)
      );
    }

    barStarts.forEach((barStart, index) => {
      const bar = new m.Bar();
      staff.addBar(bar);
      const pickupOffset = index === 0 && pickup ? STEPS_IN_BAR - pickup : 0;
      voices.forEach((events) => addVoice(bar, events, barStart, barEnd(index), pickupOffset));
    });
  });

  score.finish(settings);
  return new at.exporter.Gp7Exporter().export(score, settings);
};

// Folder and file names can't hold "/", so "Aeolian / Natural" sits in "Aeolian - Natural"
export const toFileName = (text) =>
  text.replace(/\s*\/\s*/g, (match) => (match.trim() === match ? "-" : " - ")).replace(/[\\:*?"<>|]/g, "");
