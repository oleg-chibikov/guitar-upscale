import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setLockRatio,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const LockRatioButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { lockRatio } = useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon={lockRatio ? <Lock /> : <LockOpen />}
      tooltip={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
      isActive={lockRatio}
      onPress={() => {
        dispatch(setLockRatio(!lockRatio));
      }}
    />
  );
};
