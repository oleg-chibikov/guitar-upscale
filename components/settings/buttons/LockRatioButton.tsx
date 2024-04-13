import React from "react";
import { PressableProps } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setLockRatio,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const LockRatioButton: React.FC<PressableProps> = (props) => {
  const dispatch = useDispatch();
  const { lockRatio } = useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon="lock"
      isActive={lockRatio}
      onPress={() => {
        dispatch(setLockRatio(!lockRatio));
      }}
    />
  );
};
