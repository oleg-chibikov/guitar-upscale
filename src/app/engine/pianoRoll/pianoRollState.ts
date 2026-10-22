import { EventsByTick } from "@/app/engine/eventsByTick";
import { resetPlayhead } from "@/app/engine/pianoRoll/playhead";
import { triggerShowReplay } from "@/app/store/settingsSlice";
import { Dispatch } from "react";
import { UnknownAction } from "redux";

export let pianoRollData: EventsByTick | undefined;
export const setPianoRollData = (
  data: EventsByTick | undefined,
  dispatch: Dispatch<UnknownAction>
) => {
  pianoRollData = data;
  resetPlayhead(data);

  dispatch(triggerShowReplay());
};
