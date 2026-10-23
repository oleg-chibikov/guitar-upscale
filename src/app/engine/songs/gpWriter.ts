// Writes a Song as a Guitar Pro 7 file. It imports only types, so the scripts can load it with Node's type stripping.
import type * as AlphaTab from "@coderline/alphatab";
import type { OctaveNote } from "../../data/notes";
import type { Song, SongTrack } from "../../data/song";

const TICKS_IN_QUARTER = 16;
const TICKS_IN_BAR = TICKS_IN_QUARTER * 4;
const MAX_VOICES = 4;
const DEFAULT_PROGRAM = 24;
const STANDARD_TUNING = [64, 59, 55, 50, 45, 40];
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const CHORD_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "5": [0, 7],
  "7": [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

type WriteOptions = {
  // General MIDI program for a track. Tracks without one play a nylon guitar in Guitar Pro
  getProgram?: (track: SongTrack) => number | undefined;
};

type Placed = { string: number; fret: number; chord?: string };
type Hit = { tick: number; duration: number; notes: Placed[]; velocity?: number };
type Beat = Hit & { tied: boolean };

// Guitar Pro keeps loudness per beat, from ppp (0) to fff (7). The default f plays at full volume
const FORTE = 5;

export const dynamicsToVelocity = (dynamics: number): number | undefined =>
  dynamics >= FORTE ? undefined : Math.round((127 * (dynamics + 1)) / (FORTE + 1));

export const velocityToDynamics = (velocity: number | undefined): number =>
  velocity === undefined
    ? FORTE
    : Math.min(FORTE, Math.max(0, Math.round((velocity * (FORTE + 1)) / 127) - 1));

const toMidi = (note: OctaveNote) => note.octave * 12 + note.note;

// Frets from the highest string, -1 for a muted one. Guitar Pro plays them, the app reads only the name
export const voiceChord = (name: string, tuning: number[]): number[] => {
  const root = name[1] === "#" ? name.slice(0, 2) : name.slice(0, 1);
  const rootPc = NOTE_NAMES.indexOf(root);
  const intervals = CHORD_INTERVALS[name.slice(root.length)] ?? [0, 7];
  const frets: number[] = tuning.map(() => -1);
  if (rootPc < 0) {
    return frets;
  }
  const tones = new Set(intervals.map((i) => (rootPc + i) % 12));
  const lowFirst = tuning.map((_, i) => tuning.length - 1 - i);
  const findFret = (string: number, wanted: (pc: number) => boolean) =>
    [0, 1, 2, 3, 4].find((fret) => wanted((tuning[string] + fret) % 12));
  const bassIndex = lowFirst.findIndex(
    (string) => findFret(string, (pc) => pc === rootPc) !== undefined
  );
  if (bassIndex === -1) {
    return frets;
  }
  lowFirst.slice(bassIndex).forEach((string, i) => {
    const fret =
      i === 0
        ? findFret(string, (pc) => pc === rootPc)
        : findFret(string, (pc) => tones.has(pc));
    frets[string] = fret ?? -1;
  });
  return frets;
};

// Places a pitch on the string with the lowest fret, moving it by octaves to fit the neck
const placePitch = (midi: number, tuning: number[]): Placed => {
  let pitch = midi;
  const lowest = Math.min(...tuning);
  const highest = Math.max(...tuning) + 24;
  while (pitch < lowest) pitch += 12;
  while (pitch > highest) pitch -= 12;
  const options = tuning
    .map((open, string) => ({ string, fret: pitch - open }))
    .filter((x) => x.fret >= 0 && x.fret <= 24)
    .sort((a, b) => a.fret - b.fret);
  return options[0] ?? { string: tuning.length - 1, fret: 0 };
};

const getHits = (track: SongTrack, tuning: number[]): Hit[] => {
  const notes = [
    ...track.tabNotes.map((n) => ({
      tick: n.tick,
      duration: n.duration,
      velocity: n.velocity,
      string: n.string,
      fret: n.fret,
    })),
    ...track.pitchNotes.map((n) => ({
      tick: n.tick,
      duration: n.duration,
      velocity: n.velocity,
      ...placePitch(toMidi(n.octaveNote), tuning),
    })),
  ]
    .map((n) => ({ ...n, tick: Math.max(0, Math.round(n.tick)) }))
    .sort((a, b) => a.tick - b.tick);
  // without a length a note rings until the next one
  const onsets = Array.from(new Set(notes.map((n) => n.tick)));
  const nextOnset = (tick: number) =>
    onsets.find((t) => t > tick) ?? tick + TICKS_IN_QUARTER;
  return notes.map((n) => ({
    tick: n.tick,
    duration: Math.max(1, Math.round(n.duration ?? nextOnset(n.tick) - n.tick)),
    velocity: n.velocity,
    notes: [{ string: n.string, fret: n.fret }],
  }));
};

const getChordHits = (track: SongTrack, tuning: number[]): Hit[] => {
  const chords = [...track.chords]
    .filter((c) => c.name !== undefined || (c.notes?.length ?? 0) > 0)
    .sort((a, b) => a.tick - b.tick);
  return chords.map((chord, i) => {
    const tick = Math.max(0, Math.round(chord.tick));
    const next = chords[i + 1]?.tick ?? tick + TICKS_IN_BAR;
    // a chord holds until the next one, at most to the end of its bar
    const barEnd = (Math.floor(tick / TICKS_IN_BAR) + 1) * TICKS_IN_BAR;
    const duration = Math.max(
      1,
      Math.round(Math.min(next, barEnd + TICKS_IN_BAR * 3) - tick)
    );
    const frets =
      chord.frets ??
      (chord.name !== undefined ? voiceChord(chord.name, tuning) : undefined);
    const notes: Placed[] = frets
      ? frets.flatMap((fret, string) =>
          fret !== undefined && fret >= 0
            ? [{ string, fret, chord: chord.name }]
            : []
        )
      : (chord.notes ?? []).map((n) => placePitch(toMidi(n), tuning));
    return { tick, duration, notes };
  });
};

// Spreads overlapping hits over voices, since one voice holds one rhythm
const toVoices = (hits: Hit[]): Hit[][] => {
  const voices: Hit[][] = [];
  for (const hit of hits) {
    let placed = false;
    for (const voice of voices) {
      const last = voice[voice.length - 1];
      const sameBeat =
        last.tick === hit.tick &&
        last.duration === hit.duration &&
        velocityToDynamics(last.velocity) === velocityToDynamics(hit.velocity) &&
        hit.notes.every((n) => !last.notes.some((x) => x.string === n.string));
      if (sameBeat) {
        last.notes.push(...hit.notes);
        placed = true;
        break;
      }
      if (last.tick + last.duration <= hit.tick) {
        voice.push(hit);
        placed = true;
        break;
      }
    }
    if (placed) continue;
    if (voices.length < MAX_VOICES) {
      voices.push([hit]);
      continue;
    }
    // every voice is busy, so the voice that ends first lets its note go early
    const voice = voices.reduce((a, b) =>
      a[a.length - 1].tick + a[a.length - 1].duration <=
      b[b.length - 1].tick + b[b.length - 1].duration
        ? a
        : b
    );
    const last = voice[voice.length - 1];
    if (last.tick < hit.tick) {
      last.duration = hit.tick - last.tick;
      voice.push(hit);
    }
  }
  return voices;
};

// Lengths in ticks that a single beat can show, dotted ones included
const BEAT_LENGTHS: [number, number, number][] = [
  [64, 1, 0],
  [48, 2, 1],
  [32, 2, 0],
  [24, 4, 1],
  [16, 4, 0],
  [12, 8, 1],
  [8, 8, 0],
  [6, 16, 1],
  [4, 16, 0],
  [3, 32, 1],
  [2, 32, 0],
  [1, 64, 0],
];

const splitLength = (length: number) => {
  const parts: { value: number; dots: number; ticks: number }[] = [];
  let left = length;
  while (left > 0) {
    const [ticks, value, dots] =
      BEAT_LENGTHS.find(([t]) => t <= left) ??
      BEAT_LENGTHS[BEAT_LENGTHS.length - 1];
    parts.push({ value, dots, ticks });
    left -= ticks;
  }
  return parts;
};

export const writeGuitarPro = async (
  song: Song,
  options: WriteOptions = {}
): Promise<Uint8Array> => {
  const alphaTab: typeof AlphaTab = await import("@coderline/alphatab");
  const m = alphaTab.model;
  const settings = new alphaTab.Settings();
  const score = new m.Score();
  score.artist = song.band;
  score.title = song.title;

  // a track can't hold chords and tab together, since only a Chords track gives chords
  const tracks = song.tracks.flatMap((track): SongTrack[] => {
    const hasNotes = track.tabNotes.length + track.pitchNotes.length > 0;
    const isChordsName = track.name.trim().toLowerCase().startsWith("chords");
    if (track.chords.length === 0) return hasNotes ? [track] : [];
    const chordsTrack = {
      ...track,
      name: isChordsName ? track.name : "Chords",
      tabNotes: [],
      pitchNotes: [],
    };
    return hasNotes
      ? [
          { ...track, chords: [], name: isChordsName ? "Melody" : track.name },
          chordsTrack,
        ]
      : [chordsTrack];
  });

  const pickup = Math.max(0, Math.round(song.pickupTicks ?? 0)) % TICKS_IN_BAR;
  const prepared = tracks.map((track) => {
    const tuning = track.tuning?.map(toMidi) ?? STANDARD_TUNING;
    const hits = [
      ...getHits(track, tuning),
      ...getChordHits(track, tuning),
    ].sort((a, b) => a.tick - b.tick);
    return { track, tuning, voices: toVoices(hits) };
  });
  const end = Math.max(
    1,
    ...prepared.flatMap((p) =>
      p.voices.flat().map((hit) => hit.tick + hit.duration)
    )
  );
  const barStarts = [0];
  for (let start = pickup || TICKS_IN_BAR; start < end; start += TICKS_IN_BAR)
    barStarts.push(start);
  const barEnd = (index: number) =>
    barStarts[index + 1] ??
    barStarts[index] + (index === 0 && pickup ? pickup : TICKS_IN_BAR);

  barStarts.forEach((_, index) => {
    const masterBar = new m.MasterBar();
    masterBar.timeSignatureNumerator = 4;
    masterBar.timeSignatureDenominator = 4;
    if (index === 0) {
      masterBar.isAnacrusis = pickup > 0;
      masterBar.tempoAutomations.push(
        m.Automation.buildTempoAutomation(false, 0, song.tempo ?? 120, 2)
      );
    }
    score.addMasterBar(masterBar);
  });

  prepared.forEach(({ track, tuning, voices }, trackIndex) => {
    const gpTrack = new m.Track();
    gpTrack.name = track.name;
    gpTrack.shortName = track.name.slice(0, 10);
    gpTrack.playbackInfo.program =
      options.getProgram?.(track) ?? DEFAULT_PROGRAM;
    gpTrack.playbackInfo.primaryChannel = (trackIndex * 2) % 16;
    gpTrack.playbackInfo.secondaryChannel = (trackIndex * 2 + 1) % 16;
    const staff = new m.Staff();
    staff.showTablature = true;
    staff.showStandardNotation = true;
    staff.stringTuning.tunings = [...tuning];
    gpTrack.addStaff(staff);
    score.addTrack(gpTrack);

    for (const hit of voices.flat()) {
      const name = hit.notes.find((n) => n.chord !== undefined)?.chord;
      if (name !== undefined && staff.chords?.has(name) !== true) {
        const chord = new m.Chord();
        chord.name = name;
        chord.strings = tuning.map(
          (_, string) => hit.notes.find((n) => n.string === string)?.fret ?? -1
        );
        chord.showDiagram = true;
        chord.showName = true;
        staff.addChord(name, chord);
      }
    }

    // each voice is cut into beats that stay inside their bar
    const beatsByVoice = voices.map((voice) => {
      const beats: Beat[] = [];
      for (const hit of voice) {
        let tick = hit.tick;
        const hitEnd = hit.tick + hit.duration;
        let tied = false;
        while (tick < hitEnd) {
          const barIndex = barStarts.findLastIndex((start) => start <= tick);
          const until = Math.min(hitEnd, barEnd(barIndex));
          beats.push({
            tick,
            duration: until - tick,
            notes: hit.notes,
            velocity: hit.velocity,
            tied,
          });
          tick = until;
          tied = true;
        }
      }
      return beats;
    });

    barStarts.forEach((barStart, barIndex) => {
      const bar = new m.Bar();
      staff.addBar(bar);
      const end = barEnd(barIndex);
      const voiceCount = Math.max(1, beatsByVoice.length);
      for (let v = 0; v < voiceCount; v++) {
        const voice = new m.Voice();
        bar.addVoice(voice);
        let tick = barStart;
        const addBeat = (length: number, beat?: Beat) => {
          splitLength(length).forEach((part, i) => {
            const gpBeat = new m.Beat();
            gpBeat.duration = part.value as AlphaTab.model.Duration;
            gpBeat.dots = part.dots;
            gpBeat.dynamics = velocityToDynamics(
              beat?.velocity
            ) as AlphaTab.model.DynamicValue;
            for (const note of beat?.notes ?? []) {
              const gpNote = new m.Note();
              // alphaTab counts strings from the lowest one
              gpNote.string = tuning.length - note.string;
              gpNote.fret = note.fret;
              gpNote.isTieDestination = beat?.tied === true || i > 0;
              gpBeat.addNote(gpNote);
            }
            const chordName = beat?.notes.find(
              (n) => n.chord !== undefined
            )?.chord;
            if (chordName !== undefined && i === 0 && beat?.tied !== true) {
              gpBeat.chordId = chordName;
            }
            voice.addBeat(gpBeat);
          });
        };
        for (const beat of (beatsByVoice[v] ?? []).filter(
          (b) => b.tick >= barStart && b.tick < end
        )) {
          if (beat.tick > tick) addBeat(beat.tick - tick);
          addBeat(beat.duration, beat);
          tick = beat.tick + beat.duration;
        }
        if (tick < end) addBeat(end - tick);
      }
    });
  });

  score.finish(settings);
  return new alphaTab.exporter.Gp7Exporter().export(score, settings);
};
