import React from "react";
import { PressableProps } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  toggleRecording,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const RecordButton: React.FC<PressableProps> = (props) => {
  const dispatch = useDispatch();
  const { isRecording } = useSelector(selectControlPanel);
  return (
    <>
      {isRecording && (
        <IconButton
          {...props}
          icon="cancel"
          isActive={true}
          tooltip="Cancel recording"
          activeBg="bg-gray-500"
          onPress={() => dispatch(toggleRecording(false))}
        />
      )}
      <IconButton
        {...props}
        icon={isRecording ? "stop-circle" : "fiber-manual-record"}
        isActive={isRecording}
        tooltip={isRecording ? "Stop recording and save MIDI" : "Record MIDI"}
        activeBg="bg-red-500"
        onPress={() => dispatch(toggleRecording(true))}
      />
    </>
  );
};
