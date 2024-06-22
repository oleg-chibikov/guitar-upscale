"use client";

import { Panel } from "@/app/components/layout/Panel";
import { AddLooperChannelButton } from "@/app/components/looper/AddLooperChannelButton";
import { ClearLooperButton } from "@/app/components/looper/ClearLooperButton";
import { RemoveLooperChannelButton } from "@/app/components/looper/RemoveLooperChannelButton";
import { SaveLooperRecordingButton } from "@/app/components/looper/SaveLooperRecordingButton";
import { LOOPER_PANEL_ID } from "@/app/data/elementIds";
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
  const hasAnyRecordings = Object.values(state).some((x) => x.hasRecording); // after being restored from the state array is converted to an object and just applying .some won't work

  const { guitarSettingsUpdatedTrigger, looperStateUpdateTrigger } =
    useSelector(selectSettings);
  const dispatch = useDispatch();
  useEffect(() => {
    clearLooperState();
    setState({ ...looperState });
    stopMetronomeIfNeeded(dispatch);
  }, [dispatch, guitarSettingsUpdatedTrigger]);

  useEffect(() => {
    setState({ ...looperState });
  }, [dispatch, looperStateUpdateTrigger]);
  return (
    <Panel id={LOOPER_PANEL_ID}>
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
            showPlay={hasAnyRecordings}
          />
        </div>
      ))}
      <AddLooperChannelButton setState={setState} disabled={!canAddChannel()} />
      {hasAnyRecordings && (
        <>
          <SaveLooperRecordingButton state={state} />
          <ClearLooperButton setState={setState} />
        </>
      )}
    </Panel>
  );
};
