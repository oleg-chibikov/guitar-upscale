import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import { getEventTrack } from "@/app/engine/pianoRoll/pianoRollTracks";

// the only track of a melody that plays. Picked in the piano roll
let soloTrack: { data: EventsByTick; trackNumber: number } | undefined;

export const getSoloTrack = (data: EventsByTick): number | undefined =>
  soloTrack?.data === data ? soloTrack.trackNumber : undefined;

export const setSoloTrack = (
  data: EventsByTick,
  trackNumber: number | undefined,
) => {
  if (trackNumber !== undefined) {
    soloTrack = { data, trackNumber };
  } else if (soloTrack?.data === data) {
    soloTrack = undefined;
  }
};

/**
 * The events a player should play: only the solo track's while one is picked
 */
export const getAudibleEvents = (
  data: EventsByTick,
  events: ChordOrNote[] | Set<ChordOrNote>,
): ChordOrNote[] | Set<ChordOrNote> => {
  const trackNumber = getSoloTrack(data);
  return trackNumber === undefined
    ? events
    : Array.from(events).filter(
        (event) => getEventTrack(event) === trackNumber,
      );
};
