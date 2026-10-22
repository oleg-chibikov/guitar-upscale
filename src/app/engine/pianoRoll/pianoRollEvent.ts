import {
  ChordMode,
  chordModeOrder,
  getChordName,
  getModeSuffix,
} from "@/app/data/chordModes";
import { Instrument } from "@/app/data/instruments";
import { serializeOctaveNote, StringOctaveNote } from "@/app/data/notes";
import {
  DEFAULT_CHORD_OCTAVE,
  DEFAULT_EVENT_DURATION,
} from "@/app/data/pianoRollConstants";
import { getModesForNote } from "@/app/engine/chords/chordModesByNote";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { DEFAULT_NOTE_TRACK_NUMBER } from "@/app/engine/eventBus";
import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import { octaveNoteToStringOctaveNoteMap } from "@/app/engine/generateNeckRepresentation";
import { fromPitch, toPitch } from "@/app/engine/pianoRoll/geometry";

export const isChordEvent = (event: ChordOrNote) => event.chord !== undefined;

export const getEventDuration = (event: ChordOrNote) =>
  event.duration ?? DEFAULT_EVENT_DURATION;

export const getEventPitch = (event: ChordOrNote): number => {
  if (event.note) {
    return toPitch(event.note.note);
  }
  const chord = event.chord!;
  return toPitch(
    chord.metadata.octaveNote ?? {
      octave: DEFAULT_CHORD_OCTAVE,
      note: parseChordNoteAndAlterations(chord.chord).chordBaseNote,
    }
  );
};

export const getChordModeName = (event: ChordOrNote): string | undefined => {
  const chord = event.chord;
  if (!chord) {
    return undefined;
  }
  return chord.metadata.chordMode?.name ?? getModeSuffix(chord.chord);
};

const modeOrderIndex = (mode: ChordMode) => {
  const index = chordModeOrder.indexOf(mode.name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

/**
 * Chord modes the generator built for the root of this pitch, in the order the chord panel shows them
 */
export const getChordModesForPitch = (pitch: number): ChordMode[] =>
  Array.from(getModesForNote(fromPitch(pitch).note) ?? []).sort(
    (a, b) => modeOrderIndex(a) - modeOrderIndex(b)
  );

/**
 * False when the chord generator has no voicing of this chord's mode for its root, for example after the settings changed
 */
export const isChordModeAvailable = (event: ChordOrNote): boolean => {
  if (!event.chord) {
    return true;
  }
  const modeName = getChordModeName(event);
  const modes = getModesForNote(fromPitch(getEventPitch(event)).note);
  return Array.from(modes ?? []).some((mode) => mode.name === modeName);
};

const findStringOctaveNote = (
  pitch: number,
  preferredString?: number
): StringOctaveNote | undefined => {
  const candidates = octaveNoteToStringOctaveNoteMap.get(
    serializeOctaveNote(fromPitch(pitch))
  );
  if (!candidates || candidates.length === 0) {
    return undefined;
  }
  return (
    candidates.find((candidate) => candidate.string === preferredString) ??
    candidates[0]
  );
};

export const canPlaceAtPitch = (event: ChordOrNote, pitch: number) =>
  event.note
    ? findStringOctaveNote(pitch) !== undefined
    : getChordModesForPitch(pitch).length > 0;

export type PitchChange = {
  event: ChordOrNote;
  // the chord kept its root but lost its mode, so the editor should offer the other modes
  chordModeChanged: boolean;
};

/**
 * Copy of the event at a new pitch. Undefined when the guitar neck or the chord generator can't play it there.
 */
export const withPitch = (
  event: ChordOrNote,
  pitch: number,
  preferredChordMode?: ChordMode
): PitchChange | undefined => {
  if (getEventPitch(event) === pitch && preferredChordMode === undefined) {
    return { event, chordModeChanged: false };
  }

  if (event.note) {
    const stringOctaveNote = findStringOctaveNote(pitch, event.note.note.string);
    if (!stringOctaveNote) {
      return undefined;
    }
    return {
      event: { ...event, note: { ...event.note, note: stringOctaveNote } },
      chordModeChanged: false,
    };
  }

  const chord = event.chord!;
  const modes = getChordModesForPitch(pitch);
  if (modes.length === 0) {
    return undefined;
  }
  const wantedModeName = preferredChordMode?.name ?? getChordModeName(event);
  const keptMode = modes.find((mode) => mode.name === wantedModeName);
  const mode = keptMode ?? modes[0];
  const octaveNote = fromPitch(pitch);
  return {
    event: {
      ...event,
      chord: {
        chord: getChordName(octaveNote.note, mode),
        metadata: { ...chord.metadata, chordMode: mode, octaveNote },
      },
    },
    chordModeChanged: keptMode === undefined,
  };
};

export const withDuration = (
  event: ChordOrNote,
  duration: number
): ChordOrNote => ({ ...event, duration: Math.max(1, Math.round(duration)) });

/**
 * A new single note. Undefined when no string on the neck plays this pitch.
 */
export const createNoteEvent = (
  pitch: number,
  duration: number,
  template?: { trackNumber?: number; instrument?: Instrument }
): ChordOrNote | undefined => {
  const stringOctaveNote = findStringOctaveNote(pitch);
  if (!stringOctaveNote) {
    return undefined;
  }
  const note = {
    note: stringOctaveNote,
    trackNumber: template?.trackNumber ?? DEFAULT_NOTE_TRACK_NUMBER,
    instrument: template?.instrument,
  };
  return { id: EventsByTick.generateId(note), note, duration };
};

/**
 * Same content under a fresh id, for copy and paste
 */
export const cloneWithNewId = (event: ChordOrNote): ChordOrNote => {
  const payload = event.note ?? event.chord!;
  return { ...event, id: EventsByTick.generateId(payload) };
};
