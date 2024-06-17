"use client";

import { Panel } from "@/app/components/layout/Panel";
import { AddLooperChannelButton } from "@/app/components/looper/AddLooperChannelButton";
import { RemoveLooperChannelButton } from "@/app/components/looper/RemoveLooperChannelButton";
import { SaveLooperRecordingButton } from "@/app/components/looper/SaveLooperRecordingButton";
import {
  LooperState,
  canAddChannel,
  canRemoveChannel,
  clearLooperState,
  looperState,
  stopMetronomeIfNeeded,
} from "@/app/engine/looper/looper";
import { selectSettings } from "@/app/store/settingsSlice";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LooperButton } from "./LooperButton";

export const LooperPanel: React.FC = () => {
  const [state, setState] = useState<LooperState>(looperState);
  const showPlay = Object.values(state).some((x) => x.hasRecording); // after being restored from the state array is converted to an object and just applying .some won't work

  const { guitarSettingsUpdatedTrigger } = useSelector(selectSettings);
  const dispatch = useDispatch();
  useEffect(() => {
    clearLooperState();
    setState({ ...looperState });
    stopMetronomeIfNeeded(dispatch);
  }, [dispatch, guitarSettingsUpdatedTrigger]);
  return (
    <Panel>
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
      {showPlay && <SaveLooperRecordingButton state={state} />}
    </Panel>
  );
};
