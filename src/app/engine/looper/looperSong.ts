import { TICKS_IN_BAR } from "@/app/data/clockConstants";
import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import { getTrackInfos } from "@/app/engine/pianoRoll/pianoRollTracks";

// longer than this, channels of uneven length stop at the longest loop instead
const MAX_SONG_BARS = 32;

export type Loop = {
  events: EventsByTick;
  lengthTicks: number;
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * How long the song runs, so each loop repeats a whole number of times when it can
 */
export const getLooperSongLength = (lengths: number[]) => {
  const longest = Math.max(...lengths);
  const lcm = lengths.reduce((a, b) => (a * b) / gcd(a, b));
  return lcm <= MAX_SONG_BARS * TICKS_IN_BAR ? lcm : longest;
};

// the song plays a loop event as a plain note or chord, outside the looper
const toSongEvent = (
  event: ChordOrNote,
  id: string,
  trackNumber: number,
): ChordOrNote => {
  if (event.note) {
    return {
      ...event,
      id,
      note: { ...event.note, trackNumber, looperChannel: undefined },
    };
  }
  if (event.chord) {
    return {
      ...event,
      id,
      chord: {
        ...event.chord,
        metadata: {
          ...event.chord.metadata,
          trackNumber,
          looperChannel: undefined,
          fromPlayback: undefined,
        },
      },
    };
  }
  return { ...event, id };
};

/**
 * Lays the looper channels side by side from bar 1. Each channel repeats to the song length.
 * A channel gives a track for its notes and one for its chords
 */
export const buildLooperSong = (
  loops: { channel: number; loop: Loop }[],
): EventsByTick => {
  const song = new EventsByTick();
  if (loops.length === 0) {
    return song;
  }
  const infos = getTrackInfos(song);
  const songLength = getLooperSongLength(
    loops.map(({ loop }) => loop.lengthTicks),
  );
  let nextTrack = 0;
  for (const { channel, loop } of loops) {
    const noteTrack = loop.events.flatItems.some(({ event }) => event.note)
      ? nextTrack++
      : undefined;
    const chordTrack = loop.events.flatItems.some(({ event }) => event.chord)
      ? nextTrack++
      : undefined;
    if (noteTrack !== undefined) {
      infos.set(noteTrack, { name: `Loop ${channel + 1}` });
    }
    if (chordTrack !== undefined) {
      infos.set(chordTrack, { name: `Chords, loop ${channel + 1}` });
    }
    for (let start = 0; start < songLength; start += loop.lengthTicks) {
      for (const { tick, event } of loop.events.flatItems) {
        const songTick = start + tick;
        if (tick > loop.lengthTicks || songTick > songLength) {
          continue;
        }
        const trackNumber = event.note ? noteTrack : chordTrack;
        song.insertEvent(
          songTick,
          toSongEvent(event, `${event.id}-${start}`, trackNumber ?? 0),
        );
      }
    }
  }
  return song;
};
