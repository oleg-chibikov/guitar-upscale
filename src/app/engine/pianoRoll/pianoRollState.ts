import { EventsByTick } from "@/app/engine/eventsByTick";

export let pianoRollData: EventsByTick | undefined;
export const setPianoRollData = (data: EventsByTick | undefined) => {
  pianoRollData = data;
};
