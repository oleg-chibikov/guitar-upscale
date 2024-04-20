import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PlaybackType,
  selectControlPanel,
  setPlaybackType,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const PlaybackTypeSelector: React.FC = () => {
  const { playbackType } = useSelector(selectControlPanel);
  const dispatch = useDispatch();
  const { melodies } = usePremiumFeatures();

  if (!melodies) {
    return null;
  }

  return (
    <EnumSelector
      enumObj={PlaybackType}
      selectedValue={playbackType}
      onValueChange={(value) => {
        dispatch(setPlaybackType(value));
      }}
    />
  );
};
