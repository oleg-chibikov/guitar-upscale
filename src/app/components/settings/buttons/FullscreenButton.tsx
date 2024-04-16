import CloseFullscreen from "@mui/icons-material/CloseFullscreen";
import OpenInFull from "@mui/icons-material/OpenInFull";
import React, { useState } from "react";
import screenfull from "screenfull";
import { IconButton } from "./IconButton";

export const FullscreenButton: React.FC = (props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  if (!screenfull.isEnabled) {
    return false;
  }
  return (
    <IconButton
      {...props}
      icon={!screenfull.isFullscreen ? <OpenInFull /> : <CloseFullscreen />}
      tooltip={!screenfull.isFullscreen ? "Go fullscreen" : "Exit fullscreen"}
      isActive={screenfull.isFullscreen}
      onPress={async () => {
        if (!screenfull.isFullscreen) {
          await screenfull.request();
          setIsFullscreen(true);
        } else {
          await screenfull.exit();
          setIsFullscreen(false);
        }
      }}
    />
  );
};
