"use client";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { CONTROL_PANEL_ID } from "@/app/data/elementIds";
import { Theme } from "@/app/data/theme";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import MusicNote from "@mui/icons-material/MusicNote";
import { Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";

// screen edge gaps plus the gap to the control panel
const GAPS = 16;
// narrower than this beside the control panel, the label moves under it
const MIN_WIDTH = 160;

export const NowPlaying: React.FC = () => {
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const nowPlaying = useSettingsSelector((s) => s.nowPlaying);
  const theme = useUiSelector((s) => s.theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const [controlPanel, setControlPanel] = useState({ width: 0, height: 0 });
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const element = document.getElementById(CONTROL_PANEL_ID);
    if (element === null) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const { inlineSize, blockSize } = entry.borderBoxSize[0];
      setControlPanel({ width: inlineSize, height: blockSize });
      setScreenWidth(window.innerWidth);
    });
    observer.observe(element);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  if (!isPlaying || nowPlaying === undefined) {
    return null;
  }

  const besideWidth = screenWidth - controlPanel.width - GAPS;
  const isBeside = besideWidth >= MIN_WIDTH;
  return (
    // the control panel sits on the other side, away from the chords
    <Panel
      className={`fixed z-30 ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      }`}
      style={{
        top: isBeside ? 4 : controlPanel.height + 8,
        maxWidth: isBeside ? besideWidth : MIN_WIDTH,
      }}
    >
      <Tooltip title={nowPlaying}>
        <div
          className={`flex min-w-0 items-center gap-1 px-1 text-sm ${
            theme === Theme.Light
              ? "text-foreground-light"
              : "text-foreground-dark"
          }`}
          aria-live="polite"
        >
          <MusicNote fontSize="small" />
          <span className="truncate">{nowPlaying}</span>
        </div>
      </Tooltip>
    </Panel>
  );
};
