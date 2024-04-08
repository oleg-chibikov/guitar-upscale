import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setSettingsExpanded,
} from "../../../store/controlPanelSlice";
import { IconButton } from "../../IconButton";

export const OpenSettingsButton: React.FC = () => {
  const dispatch = useDispatch();
  const { settingsExpanded } = useSelector(selectControlPanel);
  return (
    <IconButton
      icon="⚙️"
      onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
    />
  );
};
