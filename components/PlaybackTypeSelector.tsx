import React from "react";
import { useDispatch } from "react-redux";
import { PlaybackType, setPlaybackType } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import EnumSelector from "./EnumSelector";

const PlaybackTypeSelector: React.FC = () => {
  const { playbackType } = useAppSelector((state) => state.controlPanel);
  const dispatch = useDispatch();

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

export default PlaybackTypeSelector;
