import CloseFullscreen from "@mui/icons-material/CloseFullscreen";
import OpenInFull from "@mui/icons-material/OpenInFull";
import React, { useEffect, useState } from "react";
import screenfull from "screenfull";
import { IconButton } from "./IconButton";

export const FullscreenButton: React.FC = (props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (!screenfull.isEnabled) {
      return;
    }
    const handler = () => {
      setIsFullscreen(screenfull.isFullscreen);
    };
    screenfull.on("change", handler);
    return () => screenfull.off("change", handler);
  }, []);
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
        } else {
          await screenfull.exit();
        }
      }}
    />
  );
};
