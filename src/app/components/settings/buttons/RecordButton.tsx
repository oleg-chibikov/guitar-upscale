"use client";
import { Theme } from "@/app/data/theme";
import { selectSettings, setIsRecording } from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import Cancel from "@mui/icons-material/Cancel";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import StopCircle from "@mui/icons-material/StopCircle";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const RecordButton: React.FC = (props) => {
  const { theme } = useSelector(selectUi);
  const { isRecording } = useSelector(selectSettings);
  const dispatch = useDispatch();
  return (
    <>
      {isRecording && (
        <IconButton
          {...props}
          icon={<Cancel />}
          isActive={true}
          tooltip="Cancel recording"
          activeBg={
            theme === Theme.Light ? "bg-disabled-light" : "bg-disabled-dark"
          }
          onPress={async () => {
            const midiRecorder = (await import("@/app/engine/midiRecorder"))
              .midiRecorder;
            midiRecorder.stopRecording(false);
            dispatch(setIsRecording(false));
          }}
        />
      )}
      <IconButton
        {...props}
        icon={isRecording ? <StopCircle /> : <FiberManualRecord />}
        isActive={isRecording}
        tooltip={isRecording ? "Stop recording and save MIDI" : "Record MIDI"}
        activeBg="bg-red-500"
        onPress={async () => {
          const newValue = !isRecording;
          const midiRecorder = (await import("@/app/engine/midiRecorder"))
            .midiRecorder;
          if (newValue) {
            midiRecorder.startRecording();
          } else {
            midiRecorder.stopRecording(true);
          }
          dispatch(setIsRecording(newValue));
        }}
      />
    </>
  );
};
