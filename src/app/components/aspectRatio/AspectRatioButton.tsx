import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { selectUi, setShowAspectRatio } from "@/app/store/uiSlice";
import AspectRatio from "@mui/icons-material/AspectRatio";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

export const AspectRatioButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { showAspectRatio } = useSelector(selectUi);
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
