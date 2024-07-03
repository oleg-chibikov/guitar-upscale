import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setLockRatio } from "@/app/store/uiSlice";
import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import React from "react";
import { useDispatch } from "react-redux";

export const LockRatioButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const lockRatio = useUiSelector((s) => s.lockRatio);
  return (
    <IconButtonWrapper
      {...props}
      icon={
        lockRatio ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />
      }
      tooltip={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
      isActive={lockRatio}
      onPress={() => {
        dispatch(setLockRatio(!lockRatio));
      }}
    />
  );
};
