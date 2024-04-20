"use client";
import Cancel from "@mui/icons-material/Cancel";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import StopCircle from "@mui/icons-material/StopCircle";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Theme, selectControlPanel } from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const RecordButton: React.FC = (props) => {
  const [isRecording, setIsRecording] = useState<boolean>();
  const { theme } = useSelector(selectControlPanel);
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
            setIsRecording(false);
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
          const midiRecorder = (await import("@/app/engine/midiRecorder"))
            .midiRecorder;
          const newValue = !isRecording;
          if (newValue) {
            midiRecorder.startRecording();
          } else {
            midiRecorder.stopRecording(true);
          }
          setIsRecording(newValue);
        }}
      />
    </>
  );
};
