"use client";

import { AddLooperChannelButton } from "@/app/components/looper/AddLooperChannelButton";
import { RemoveLooperChannelButton } from "@/app/components/looper/RemoveLooperChannelButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import {
  LooperState,
  canAddChannel,
  canRemoveChannel,
  clearLooperState,
  looperState,
  stopMetronomeIfNeeded,
} from "@/app/engine/looper/looper";
import { selectSettings } from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LooperButton } from "./LooperButton";

export const LooperPanel: React.FC = () => {
  const [state, setState] = useState<LooperState>(looperState);
  const { chordsDisplayMode } = useSelector(selectUi);
  const showPlay = Object.values(state).some((x) => x.hasRecording); // after being restored from the state array is converted to an object and just applying .some won't work

  const { guitarSettingsUpdatedTrigger } = useSelector(selectSettings);
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  useEffect(() => {
    clearLooperState();
    setState({ ...looperState });
    stopMetronomeIfNeeded(dispatch);
  }, [dispatch, guitarSettingsUpdatedTrigger]);
  return (
    <div
      className={`flex border-2 ${
        theme === Theme.Light
          ? "bg-panel-light border-border-light"
          : "bg-panel-dark border-border-dark"
      } fixed bottom-1 gap-1 justify-between ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
    >
      <RemoveLooperChannelButton
        setState={setState}
        disabled={!canRemoveChannel()}
      />
      {looperState.map((_, index) => (
        <div key={index}>
          <LooperButton
            channel={index}
            state={state[index]}
            setState={setState}
            showPlay={showPlay}
          />
        </div>
      ))}
      <AddLooperChannelButton setState={setState} disabled={!canAddChannel()} />
    </div>
  );
};
