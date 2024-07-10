import { EventsByTick } from "@/app/engine/eventsByTick";
import { triggerShowReplay } from "@/app/store/settingsSlice";
import { Dispatch } from "react";
import { UnknownAction } from "redux";

export let pianoRollData: EventsByTick | undefined;
export const setPianoRollData = (
  data: EventsByTick | undefined,
  dispatch: Dispatch<UnknownAction>
) => {
  pianoRollData = data;

  dispatch(triggerShowReplay());
};
