import { getInstrumentLabel, Instrument } from "@/app/data/instruments";
import { DEFAULT_CHORD_TRACK_NUMBER } from "@/app/engine/eventBus";
import { ChordOrNote, EventForTick } from "@/app/engine/eventsByTick";

export type PianoRollTrack = {
  trackNumber: number;
  label: string;
  // new notes in this track play with it
  instrument?: Instrument;
};

// the name and instrument a song gives its track, by track number
export type TrackInfo = { name: string; instrument?: Instrument };

export const getEventTrack = (event: ChordOrNote): number =>
  event.note
    ? event.note.trackNumber
    : event.chord?.metadata.trackNumber ?? DEFAULT_CHORD_TRACK_NUMBER;

/**
 * The tracks of the song plus any track the events use, in track order
 */
export const listTracks = (
  events: EventForTick[],
  songTracks: (TrackInfo | undefined)[] = []
): PianoRollTrack[] => {
  const tracks = new Map<number, PianoRollTrack>();
  songTracks.forEach((info, trackNumber) => {
    if (info) {
      tracks.set(trackNumber, {
        trackNumber,
        label: info.name,
        instrument: info.instrument,
      });
    }
  });
  for (const { event } of events) {
    const trackNumber = getEventTrack(event);
    if (!tracks.has(trackNumber)) {
      tracks.set(trackNumber, {
        trackNumber,
        label: "",
        instrument:
          event.note?.instrument ?? event.chord?.metadata.trackInstrument,
      });
    }
  }
  return Array.from(tracks.values())
    .sort((a, b) => a.trackNumber - b.trackNumber)
    .map((track) => ({
      ...track,
      label:
        track.label.trim() ||
        (track.instrument !== undefined
          ? getInstrumentLabel(track.instrument)
          : `Track ${track.trackNumber + 1}`),
    }));
};

/**
 * Same event moved to another track, for a paste into the track being edited
 */
export const withTrack = (
  event: ChordOrNote,
  track: PianoRollTrack
): ChordOrNote => {
  if (event.note) {
    return {
      ...event,
      note: {
        ...event.note,
        trackNumber: track.trackNumber,
        instrument: track.instrument,
      },
    };
  }
  if (event.chord) {
    return {
      ...event,
      chord: {
        ...event.chord,
        metadata: {
          ...event.chord.metadata,
          trackNumber: track.trackNumber,
          trackInstrument: track.instrument,
        },
      },
    };
  }
  return event;
};
