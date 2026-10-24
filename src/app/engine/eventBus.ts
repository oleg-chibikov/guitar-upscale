import { ChordMode } from "@/app/data/chordModes";
import { Subject } from "rxjs";
import { Instrument } from "../data/instruments";
import {
  OctaveNote,
  StringOctaveNote,
  serializeStringOctaveNote,
} from "../data/notes";
import { chordInstrumentValue, instrumentValue } from "../store/settingsSlice";
import { currentlyRecordingLooperChannel } from "./looper/looperShared";
import { playNote } from "./sound/soundProvider";

export const DEFAULT_NOTE_TRACK_NUMBER = 0;
export const DEFAULT_CHORD_TRACK_NUMBER = 1;

export type PlayNoteParams = {
  stringOctaveNote: StringOctaveNote;
  durationMs?: number;
  // the main volume scaled by the note's velocity. Undefined plays at the main volume
  volume?: number;
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
    chordFinger?: number;
    skipChordDetection?: boolean;
    looperChannel?: number;
    // played by the app from a melody, so a recording skips it
    fromPlayback?: boolean;
  };

export type ChordClearMetadata = {
  clear: boolean;
};

export type ChordMetadata = TrackMetadata & {
  notesToPlay?: number;
  strummingDelayMs?: number;
  looperChannel?: number;
  chordMode?: ChordMode;
  octaveNote?: OctaveNote;
  fromPlayback?: boolean;
};

export type ChordWithPlayMetadata = {
  chord: string;
  metadata: ChordMetadata;
};

type TickInfo = {
  isBar: boolean;
  isBeat: boolean;
  tick: number;
};

export const NotePlayEventBus = new Subject<NoteMetadata>();
export const ChordEventBus = new Subject<ChordWithPlayMetadata>();
export const MetronomeEventBus = new Subject<TickInfo>();

export const NoteToFretMarkerEventMap: Map<
  string,
  (metadata: NoteMetadata | ClearNoteMetadata) => void
> = new Map<string, () => void>();

export const ChordToChordButtonEventMap: Map<
  string,
  (metadata: ChordMetadata | ChordClearMetadata) => void
> = new Map<string, (metadata: ChordMetadata | ChordClearMetadata) => void>();

export const fretMarkersFromPreviousChord: Set<string> = new Set<string>();
export let previousChord: string;

const play = async ({
  stringOctaveNote,
  trackInstrument,
  volume,
  fromChord,
  durationMs,
}: NoteMetadata) => {
  // This module is essential and should be loaded asap, so I commented out lazy loading here
  // const playNote = (await import("@/app/engine/sound/soundProvider"))
  //   .playNote;
  await playNote(
    stringOctaveNote,
    volume,
    trackInstrument ??
      (fromChord === true ? chordInstrumentValue : instrumentValue),
    // instrumentRef.current ?? instrument,
    undefined,
    durationMs,
  );
};

NotePlayEventBus.subscribe(async (noteMetadata: NoteMetadata) => {
  const fromChord = noteMetadata.fromChord === true;
  void play(noteMetadata);
  //console.log("EventBus: Note play requested", noteMetadata.stringOctaveNote);
  const serialized = serializeStringOctaveNote(noteMetadata.stringOctaveNote);
  const animateAction = NoteToFretMarkerEventMap.get(serialized);
  if (fromChord === true && animateAction) {
    fretMarkersFromPreviousChord.add(serialized);
  }

  const midiRecorder = (await import("./midiRecorder/midiRecorder"))
    .midiRecorder;
  const trackNumber =
    noteMetadata.trackNumber ??
    (fromChord ? DEFAULT_CHORD_TRACK_NUMBER : DEFAULT_NOTE_TRACK_NUMBER);
  const trackInstrument =
    noteMetadata.trackInstrument ??
    (fromChord ? chordInstrumentValue : instrumentValue);
  if (noteMetadata.fromPlayback !== true) {
    midiRecorder.addNoteAtGlobalTick(
      noteMetadata.stringOctaveNote,
      trackNumber,
      trackInstrument,
      fromChord,
    );
  }

  if (
    !fromChord && // chords are recorded separately
    noteMetadata.looperChannel === undefined &&
    currentlyRecordingLooperChannel !== undefined
  ) {
    const { looperState } = await import("./looper/looper");
    looperState[currentlyRecordingLooperChannel].looperRecorder.recordNote(
      noteMetadata.stringOctaveNote,
      trackNumber,
      trackInstrument,
    );
  }

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

ChordEventBus.subscribe(async (chordWithMetadata: ChordWithPlayMetadata) => {
  console.log("EventBus: Chord play requested", chordWithMetadata);

  // don't check for the same chord here - we need to clear the previous variation of the same chord (they might differ)
  clearPreviousChords();
  previousChord = chordWithMetadata.chord;

  const metadata = chordWithMetadata.metadata;

  const playAction = ChordToChordButtonEventMap.get(chordWithMetadata.chord);
  playAction?.(metadata);

  const midiRecorder = (await import("./midiRecorder/midiRecorder"))
    .midiRecorder;
  if (metadata.fromPlayback !== true) {
    midiRecorder.addChordAtGlobalTick(chordWithMetadata);
  }

  if (
    metadata.looperChannel === undefined &&
    currentlyRecordingLooperChannel !== undefined
  ) {
    const { looperState } = await import("./looper/looper");
    looperState[currentlyRecordingLooperChannel].looperRecorder.recordChord(
      chordWithMetadata,
    );
  }
});
