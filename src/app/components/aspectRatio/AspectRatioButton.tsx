import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setShowAspectRatio } from "@/app/store/uiSlice";
import AspectRatio from "@mui/icons-material/AspectRatio";
import React from "react";
import { useDispatch } from "react-redux";

export const AspectRatioButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const showAspectRatio = useUiSelector((s) => s.showAspectRatio);
  return (
    <IconButtonWrapper
      {...props}
      icon={<AspectRatio />}
      tooltip={"Change fretboard aspect ratio"}
      isActive={showAspectRatio}
      onPress={() => {
        dispatch(setShowAspectRatio(!showAspectRatio));
      }}
    />
  );
};
