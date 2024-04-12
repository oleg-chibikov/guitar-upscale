import React from "react";
import { PressableProps } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setIsRecording,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const RecordButton: React.FC<PressableProps> = (props) => {
  const dispatch = useDispatch();
  const { isRecording } = useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon={isRecording ? "stop-circle" : "fiber-manual-record"}
      isActive={isRecording}
      activeBg="bg-red-400"
      onPress={() => dispatch(setIsRecording(!isRecording))}
    />
  );
};
