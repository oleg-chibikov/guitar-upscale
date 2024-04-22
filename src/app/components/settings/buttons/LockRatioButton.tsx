import { selectUi, setLockRatio } from "@/app/store/uiSlice";
import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const LockRatioButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { lockRatio } = useSelector(selectUi);
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
