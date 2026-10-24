import { EventsByTick } from "@/app/engine/eventsByTick";
import { CommandBuilder } from "@/app/engine/pianoRoll/editCommand";
import { getEditHistory } from "@/app/engine/pianoRoll/editHistory";
import {
  getEventTrack,
  getTrackInfos,
  listTracks,
  withTrack,
} from "@/app/engine/pianoRoll/pianoRollTracks";

const TAKE_PREFIX = "Take ";

const getNextTakeNumber = (data: EventsByTick) =>
  Array.from(getTrackInfos(data).values()).filter(({ name }) =>
    name.startsWith(TAKE_PREFIX),
  ).length + 1;

/**
 * Adds a recorded take to a melody after its last track. Notes and chords get a track each.
 * Undo in the piano roll takes it out again.
 * @returns false when the take has no events
 */
export const addRecordedTracks = (
  data: EventsByTick,
  take: EventsByTick,
): boolean => {
  const infos = getTrackInfos(data);
  const takeName = `${TAKE_PREFIX}${getNextTakeNumber(data)}`;
  let nextTrack =
    Math.max(
      -1,
      ...infos.keys(),
      ...listTracks(data.flatItems, infos).map(
        ({ trackNumber }) => trackNumber,
      ),
    ) + 1;
  const tracksByTakeTrack = new Map<number, number>();
  const builder = new CommandBuilder(data, "Record a take");
  for (const { tick, event } of take.flatItems) {
    const takeTrack = getEventTrack(event);
    let trackNumber = tracksByTakeTrack.get(takeTrack);
    const instrument =
      event.note?.instrument ?? event.chord?.metadata.trackInstrument;
    if (trackNumber === undefined) {
      trackNumber = nextTrack++;
      tracksByTakeTrack.set(takeTrack, trackNumber);
      infos.set(trackNumber, {
        // a song plays chords only from a track whose name starts with "Chords"
        name: event.chord ? `Chords, ${takeName.toLowerCase()}` : takeName,
        instrument,
      });
    }
    const moved = withTrack(event, { trackNumber, label: "", instrument });
    builder.set(moved.id, { tick, event: moved });
  }
  const command = builder.build();
  if (!command) {
    return false;
  }
  getEditHistory(data).execute(command);
  return true;
};
