import { EventsByTick } from "@/app/engine/eventsByTick";
import { pianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useEffect, useState } from "react";

export const usePianoRollData = () => {
  const showReplayTrigger = useSettingsSelector((s) => s.showReplayTrigger);
  const [dataToPlay, setDataToPlay] = useState<EventsByTick | undefined>();
  useEffect(() => {
    setDataToPlay(pianoRollData);
  }, [showReplayTrigger]);
  return dataToPlay?.hasItems === true ? dataToPlay : undefined;
};
