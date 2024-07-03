"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setIsRecording } from "@/app/store/settingsSlice";
import Cancel from "@mui/icons-material/Cancel";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import StopCircle from "@mui/icons-material/StopCircle";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

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
            const midiRecorder = (
              await import("@/app/engine/midiRecorder/midiRecorder")
            ).midiRecorder;
            midiRecorder.stopRecording(false);
            dispatch(
              setIsRecording({
                value: false,
                startRecording: midiRecorder.startRecording,
                stopRecording: () => {
                  midiRecorder.stopRecording(false);
                },
              })
            );
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
          const midiRecorder = (
            await import("@/app/engine/midiRecorder/midiRecorder")
          ).midiRecorder;
          dispatch(
            setIsRecording({
              value: newValue,
              startRecording: () => {
                midiRecorder.startRecording();
              },
              stopRecording: () => {
                midiRecorder.stopRecording(true);
              },
            })
          );
        }}
      />
    </>
  );
};
