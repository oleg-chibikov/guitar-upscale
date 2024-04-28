import { Subject } from "rxjs";
import { Instrument } from "../data/instruments";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";
import {
  chordInstrumentValue,
  instrumentValue,
  reverbStrengthValue,
  tempoBpmValue,
  velocityValue,
} from "../store/settingsSlice";
import { quarterBeatToMilliseconds } from "./mainClock";
import { playNote } from "./sound/soundProvider";

export type PlayNoteParams = {
  stringOctaveNote: StringOctaveNote;
  velocity?: number; // TODO: so far it is not supplied anywhere, but we might need to implement velocity per single note. It should also be relative to the main velocity. Actually main velocity is actually volume. Change it - there is Volume in smplr
};

export type TrackMetadata = {
  trackNumber?: number;
  trackInstrument?: Instrument;
};

export type ClearNoteMetadata = {
  clearChordMarker?: boolean;
};

export type NoteMetadata = TrackMetadata &
  PlayNoteParams & {
    fromChord?: boolean;
  };

export type ChordMetadata = TrackMetadata & {
  notesToPlay?: number;
  strummingDelayMs?: number;
  clear?: boolean;
};

export type ChordWithPlayMetadata = {
  chord: string;
  metadata: ChordMetadata;
};

type Tick = {
  isBeat: boolean;
  tick: number;
};

export const NotePlayEventBus = new Subject<NoteMetadata>();
export const ChordEventBus = new Subject<ChordWithPlayMetadata>();
export const MetronomeEventBus = new Subject<Tick>();

export const NoteToFretMarkerEventMap: Map<
  string,
  (metadata: NoteMetadata | ClearNoteMetadata) => void
> = new Map<string, () => void>();

export const ChordToChordButtonEventMap: Map<
  string,
  (metadata: ChordMetadata) => void
> = new Map<string, (metadata: ChordMetadata) => void>();

export const fretMarkersFromPreviousChord: Set<string> = new Set<string>();
export let previousChord: string;

const play = async ({
  stringOctaveNote,
  trackInstrument,
  velocity,
  fromChord,
}: NoteMetadata) => {
  // This module is essential and should be loaded asap, so I commented out lazy loading here
  // const playNote = (await import("@/app/engine/sound/soundProvider"))
  //   .playNote;
  await playNote(
    stringOctaveNote,
    velocity ?? velocityValue,
    trackInstrument ?? (fromChord ? chordInstrumentValue : instrumentValue),
    // instrumentRef.current ?? instrument,
    reverbStrengthValue,
    quarterBeatToMilliseconds(tempoBpmValue)
  );
};

NotePlayEventBus.subscribe(async (noteMetadata: NoteMetadata) => {
  play(noteMetadata);
  console.log("EventBus: Note play requested", noteMetadata.stringOctaveNote);
  const serialized = serializeStringOctaveNote(noteMetadata.stringOctaveNote);
  const animateAction = NoteToFretMarkerEventMap.get(serialized);
  if (noteMetadata.fromChord && animateAction) {
    fretMarkersFromPreviousChord.add(serialized);
  }

  const midiRecorder = (await import("./midiRecorder")).midiRecorder;
  const trackNumber =
    noteMetadata.trackNumber ?? (noteMetadata.fromChord ? 1 : 0);
  const trackInstrument =
    noteMetadata.trackInstrument ??
    (noteMetadata.fromChord ? chordInstrumentValue : instrumentValue);
  midiRecorder.addNoteToMidiTrack(
    noteMetadata.stringOctaveNote,
    trackNumber,
    trackInstrument
  );

  animateAction?.(noteMetadata);
});

export const clearPreviousChords = () => {
  if (previousChord) {
    const previousChordAction = ChordToChordButtonEventMap.get(previousChord);
    previousChordAction?.({
      clear: true,
    });
  }
  for (const note of Array.from(fretMarkersFromPreviousChord)) {
    const noteFromThePreviousChordAction = NoteToFretMarkerEventMap.get(note);
    noteFromThePreviousChordAction?.({
      clearChordMarker: true,
    });
  }
  fretMarkersFromPreviousChord.clear(); // clear previous chord;
};

ChordEventBus.subscribe((chord: ChordWithPlayMetadata) => {
  console.log("EventBus: Chord play requested", chord);
  clearPreviousChords();
  previousChord = chord.chord;

  const playAction = ChordToChordButtonEventMap.get(chord.chord);

  playAction?.(chord.metadata);
});
