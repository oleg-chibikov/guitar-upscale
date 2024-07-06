import { EventsByTick } from "@/app/engine/eventsByTick";

export let pianoRollData: EventsByTick;
export const setPianoRollData = (data: EventsByTick) => {
  pianoRollData = data;
};
