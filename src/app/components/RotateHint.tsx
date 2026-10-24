"use client";

import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import Close from "@mui/icons-material/Close";
import ScreenRotation from "@mui/icons-material/ScreenRotation";
import { FC, useState } from "react";

// shows only on a phone held upright, where the neck doesn't fit
export const RotateHint: FC = () => {
  const theme = useUiSelector((s) => s.theme);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) {
    return null;
  }
  return (
    <aside
      role="status"
      className={`fixed top-16 left-1/2 z-30 hidden w-[min(22rem,calc(100vw-16px))] -translate-x-1/2 items-center gap-2 rounded-xl border p-2 text-sm portraittouch:flex ${
        theme === Theme.Light
          ? "border-bar_border-light bg-bar-light text-foreground-light"
          : "border-bar_border-dark bg-bar-dark text-foreground-dark"
      }`}
    >
      <ScreenRotation fontSize="small" />
      <span className="flex-1">Turn your phone sideways to see the neck.</span>
      <IconButtonWrapper
        icon={<Close fontSize="small" />}
        tooltip="Hide this tip"
        onPress={() => setDismissed(true)}
      />
    </aside>
  );
};
