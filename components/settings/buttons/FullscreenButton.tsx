import React from "react";
import { PressableProps } from "react-native";
import screenfull from "screenfull";
import { IconButton } from "./IconButton";

export const FullscreenButton: React.FC<PressableProps> = (props) => {
  return (
    <IconButton
      {...props}
      icon={
        screenfull.isEnabled && !screenfull.isFullscreen
          ? "open-in-full"
          : "close-fullscreen"
      }
      tooltip={
        screenfull.isEnabled && !screenfull.isFullscreen
          ? "Go fullscreen"
          : "Exit fullscreen"
      }
      isActive={screenfull.isEnabled && screenfull.isFullscreen}
      onPress={() => {
        if (screenfull.isEnabled) {
          if (!screenfull.isFullscreen) {
            screenfull.request();
          } else {
            screenfull.exit();
          }
        }
      }}
    />
  );
};
