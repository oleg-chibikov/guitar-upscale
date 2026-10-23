import { getInstrumentLabel, Instrument } from "@/app/data/instruments";
import { DEFAULT_CHORD_TRACK_NUMBER } from "@/app/engine/eventBus";
import {
  ChordOrNote,
  EventForTick,
  EventsByTick,
} from "@/app/engine/eventsByTick";

export type PianoRollTrack = {
  trackNumber: number;
  label: string;
  // new notes in this track play with it
  instrument?: Instrument;
};

// the name and instrument of a track. A removed track still names its notes after an undo
export type TrackInfo = {
  name: string;
  instrument?: Instrument;
  removed?: boolean;
};

const trackInfos = new WeakMap<EventsByTick, Map<number, TrackInfo>>();

/**
 * The tracks a melody names, by track number. The piano roll adds, renames and removes them here
 */
export const getTrackInfos = (data: EventsByTick): Map<number, TrackInfo> => {
  let infos = trackInfos.get(data);
  if (!infos) {
    infos = new Map();
    trackInfos.set(data, infos);
  }
  return infos;
};

export const getEventTrack = (event: ChordOrNote): number =>
  event.note
    ? event.note.trackNumber
    : event.chord?.metadata.trackNumber ?? DEFAULT_CHORD_TRACK_NUMBER;

/**
 * The named tracks plus any track the events use, in track order
 */
export const listTracks = (
  events: EventForTick[],
  infos: ReadonlyMap<number, TrackInfo> = new Map()
): PianoRollTrack[] => {
  const used = new Set(events.map(({ event }) => getEventTrack(event)));
  const tracks = new Map<number, PianoRollTrack>();
  infos.forEach((info, trackNumber) => {
    if (info.removed !== true || used.has(trackNumber)) {
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
 * Adds an empty track after every track the melody had, removed ones included
 */
export const addTrackInfo = (
  data: EventsByTick,
  tracks: PianoRollTrack[]
): number => {
  const infos = getTrackInfos(data);
  const trackNumber =
    Math.max(
      -1,
      ...infos.keys(),
      ...tracks.map(({ trackNumber }) => trackNumber)
    ) + 1;
  infos.set(trackNumber, { name: `Track ${trackNumber + 1}` });
  return trackNumber;
};

const getInfo = (data: EventsByTick, track: PianoRollTrack): TrackInfo =>
  getTrackInfos(data).get(track.trackNumber) ?? {
    name: "",
    instrument: track.instrument,
  };

export const renameTrackInfo = (
  data: EventsByTick,
  track: PianoRollTrack,
  name: string
) => {
  getTrackInfos(data).set(track.trackNumber, {
    ...getInfo(data, track),
    name: name.trim(),
  });
};

export const removeTrackInfo = (data: EventsByTick, track: PianoRollTrack) => {
  getTrackInfos(data).set(track.trackNumber, {
    ...getInfo(data, track),
    removed: true,
  });
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
