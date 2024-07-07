"use client";
import { setPianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import {
  isAnyTimerSpecificActivityBesidesMetronomeRunning,
  isMetronomeActiveValue,
  setIsMetronomeActive,
  setIsRecording,
  toggleMetronomeWhenRecordingValue,
  tryToggleInterval,
} from "@/app/store/settingsSlice";
import Cancel from "@mui/icons-material/Cancel";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import StopCircle from "@mui/icons-material/StopCircle";
import React, { Dispatch } from "react";
import { useDispatch } from "react-redux";
import { UnknownAction } from "redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

async function toggleRecording(
  newValue: boolean,
  dispatch: Dispatch<UnknownAction>,
  saveWhenStop: boolean
) {
  const midiRecorder = (await import("@/app/engine/midiRecorder/midiRecorder"))
    .midiRecorder;
  dispatch(setIsRecording(newValue));
  tryToggleInterval(newValue);

  const canTriggerMetronome =
    toggleMetronomeWhenRecordingValue && isMetronomeActiveValue !== newValue;
  if (newValue) {
    // start recording
    midiRecorder.startRecording();
    if (canTriggerMetronome) {
      dispatch(setIsMetronomeActive(true));
    }
    return;
  }

  // stop recording
  const eventsByTick = midiRecorder.stopRecording(saveWhenStop);
  if (eventsByTick) {
    setPianoRollData(eventsByTick, dispatch);
  }
  if (
    canTriggerMetronome &&
    !isAnyTimerSpecificActivityBesidesMetronomeRunning()
  ) {
    // only stop metronome when there is no other playing activity
    dispatch(setIsMetronomeActive(false));
  }
}

export const RecordButton: React.FC = (props) => {
  const isRecording = useSettingsSelector((s) => s.isRecording);
  const dispatch = useDispatch();
  return (
    <>
      {isRecording && (
        <IconButtonWrapper
          {...props}
          icon={<Cancel />}
          isActive={true}
          tooltip="Cancel recording"
          onPress={async () => {
            await toggleRecording(false, dispatch, false);
          }}
        />
      )}
      <IconButtonWrapper
        {...props}
        icon={isRecording ? <StopCircle /> : <FiberManualRecord />}
        isActive={isRecording}
        tooltip={isRecording ? "Stop recording and save MIDI" : "Record MIDI"}
        activeBg="error"
        onPress={async () => {
          const newValue = !isRecording;
          await toggleRecording(newValue, dispatch, true);
        }}
      />
    </>
  );
};
