import { beatToMilliseconds } from "@/app/helpers/clockHelper";
import { Subject } from "rxjs";
import { Instrument } from "../data/instruments";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";
import {
  chordInstrumentValue,
  instrumentValue,
  reverbStrengthValue,
  tempoBpmValue,
  volumeValue,
} from "../store/settingsSlice";
import { currentlyRecordingLooperChannel } from "./looper/looperShared";
import { playNote } from "./sound/soundProvider";

export const DEFAULT_NOTE_TRACK_NUMBER = 0;
export const DEFAULT_CHORD_TRACK_NUMBER = 1;

export type PlayNoteParams = {
  stringOctaveNote: StringOctaveNote;
  volume?: number; // TODO: so far it is not supplied anywhere, but we might need to implement velocity per single note. It should also be relative to the main velocity. Actually main velocity is actually volume. Change it - there is Volume in smplr
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
    skipChordDetection?: boolean;
    looperChannel?: number;
  };

export type ChordMetadata = TrackMetadata & {
  notesToPlay?: number;
  strummingDelayMs?: number;
  clear?: boolean;
  looperChannel?: number;
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
  (metadata: ChordMetadata) => void
> = new Map<string, (metadata: ChordMetadata) => void>();

export const fretMarkersFromPreviousChord: Set<string> = new Set<string>();
export let previousChord: string;

const play = async ({
  stringOctaveNote,
  trackInstrument,
  volume,
  fromChord,
}: NoteMetadata) => {
  // This module is essential and should be loaded asap, so I commented out lazy loading here
  // const playNote = (await import("@/app/engine/sound/soundProvider"))
  //   .playNote;
  await playNote(
    stringOctaveNote,
    volume ?? volumeValue,
    trackInstrument ??
      (fromChord === true ? chordInstrumentValue : instrumentValue),
    // instrumentRef.current ?? instrument,
    reverbStrengthValue,
    beatToMilliseconds(tempoBpmValue)
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
  midiRecorder.addNoteAtGlobalTick(
    noteMetadata.stringOctaveNote,
    trackNumber,
    trackInstrument
  );

  if (
    !fromChord && // chords are recorded separately
    noteMetadata.looperChannel === undefined &&
    currentlyRecordingLooperChannel !== undefined
  ) {
    const { looperState } = await import("./looper/looper");
    looperState[currentlyRecordingLooperChannel].looperRecorder.recordNote(
      noteMetadata.stringOctaveNote,
      trackNumber,
      trackInstrument
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

  if (
    metadata.looperChannel === undefined &&
    currentlyRecordingLooperChannel !== undefined
  ) {
    const { looperState } = await import("./looper/looper");
    looperState[currentlyRecordingLooperChannel].looperRecorder.recordChord(
      chordWithMetadata
    );
  }
});
