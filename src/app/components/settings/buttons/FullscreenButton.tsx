import CloseFullscreen from "@mui/icons-material/CloseFullscreen";
import OpenInFull from "@mui/icons-material/OpenInFull";
import React from "react";
import screenfull from "screenfull";
import { IconButton } from "./IconButton";

export const FullscreenButton: React.FC = (props) => {
  return (
    <IconButton
      {...props}
      icon={
        screenfull.isEnabled && !screenfull.isFullscreen ? (
          <OpenInFull />
        ) : (
          <CloseFullscreen />
        )
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
