import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { Example, getExampleName } from "@/app/data/example";
import { Instrument, getProgramForInstrument } from "@/app/data/instruments";
import { Song, SongTrack, isChordsTrackName } from "@/app/data/song";
import { getOctaveNotesForTuning } from "@/app/data/tunings";
import { chordPreferredVariationsByName } from "@/app/engine/chords/chordNotesByName";
import { getCurrentRoot } from "@/app/engine/decoders/songDecoder";
import { DEFAULT_CHORD_TRACK_NUMBER } from "@/app/engine/eventBus";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { writeGuitarPro } from "@/app/engine/songs/gpWriter";
import { toFileName } from "@/app/engine/songs/songHelpers";
import {
  scaleGroupValue,
  scaleValue,
  tempoBpmValue,
  tuningValue,
} from "@/app/store/settingsSlice";

const humanize = (instrument: Instrument) =>
  instrument
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const getChordFrets = (name: string) => {
  const variation = chordPreferredVariationsByName.get(name)?.variation;
  if (!variation) {
    return undefined;
  }
  const frets: (number | undefined)[] = [];
  for (const note of variation) {
    if (note) {
      frets[note.string] = note.fret;
    }
  }
  return frets;
};

// The song as it sounds now: in the key and tuning from the settings, with the piano roll edits
export const eventsToSong = (events: EventsByTick, example?: Example): Song => {
  const tuning = getOctaveNotesForTuning(tuningValue);
  const tracks = new Map<number, SongTrack>();
  const getTrack = (trackNumber: number, instrument?: Instrument) => {
    let track = tracks.get(trackNumber);
    if (!track) {
      const source = example?.song?.tracks.at(trackNumber);
      track = {
        name: source?.name ?? "",
        instrument: source ? source.instrument : instrument,
        tuning,
        tabNotes: [],
        pitchNotes: [],
        chords: [],
      };
      tracks.set(trackNumber, track);
    }
    return track;
  };

  for (const { tick, event } of events.flatItems) {
    if (event.note) {
      const { note, trackNumber, instrument } = event.note;
      getTrack(trackNumber, instrument).tabNotes.push({
        tick,
        string: note.string,
        fret: note.fret,
        duration: event.duration ?? TICKS_IN_BEAT,
      });
    } else if (event.chord) {
      const { chord, metadata } = event.chord;
      getTrack(metadata.trackNumber ?? DEFAULT_CHORD_TRACK_NUMBER).chords.push({
        tick,
        name: chord,
        frets: getChordFrets(chord),
      });
    }
  }

  const named = Array.from(tracks.entries())
    .sort(([a], [b]) => a - b)
    .map(([, track]) => {
      if (track.name !== "") {
        return track;
      }
      const isChords = track.chords.length > 0 && track.tabNotes.length === 0;
      const name = isChords
        ? "Chords"
        : track.instrument !== undefined
        ? humanize(track.instrument)
        : "Melody";
      return { ...track, name };
    })
    // a chords track keeps the instrument from the settings
    .map((track) =>
      isChordsTrackName(track.name)
        ? { ...track, instrument: undefined }
        : track
    );

  return {
    band: example?.band ?? "Guitar Upscale",
    title: example?.title ?? `${scaleGroupValue} ${scaleValue}`,
    tempo: tempoBpmValue,
    root: getCurrentRoot(),
    pickupTicks: example?.song?.pickupTicks,
    tracks: named,
  };
};

export const songToGuitarPro = (song: Song) =>
  writeGuitarPro(song, {
    getProgram: (track) =>
      track.instrument !== undefined
        ? getProgramForInstrument(track.instrument)
        : undefined,
  });

export const getSongFileName = (song: Pick<Song, "band" | "title">) =>
  `${toFileName(getExampleName(song))}.gp`;

export const downloadBytes = (bytes: Uint8Array, fileName: string) => {
  const url = URL.createObjectURL(
    new Blob([bytes as Uint8Array<ArrayBuffer>], {
      type: "application/octet-stream",
    })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadEventsAsGuitarPro = async (
  events: EventsByTick,
  example?: Example
) => {
  const song = eventsToSong(events, example);
  downloadBytes(await songToGuitarPro(song), getSongFileName(song));
};
