import React from "react";
import { PressableProps } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setSettingsExpanded,
} from "../../../store/controlPanelSlice";
import { IconButton } from "../../core/IconButton";

export const OpenSettingsButton: React.FC<PressableProps> = (props) => {
  const dispatch = useDispatch();
  const { settingsExpanded } = useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon="settings"
      isActive={settingsExpanded}
      onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
    />
  );
};
