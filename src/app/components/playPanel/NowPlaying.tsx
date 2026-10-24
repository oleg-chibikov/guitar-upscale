"use client";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { CONTROL_PANEL_ID } from "@/app/data/elementIds";
import { RecordTarget } from "@/app/data/recordTarget";
import { Theme } from "@/app/data/theme";
import { setPianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useLoadedSong } from "@/app/hooks/useLoadedSong";
import { isPlayingValue, stopMetronomeIfIdle } from "@/app/store/settingsSlice";
import { setPianoRollExpanded } from "@/app/store/uiSlice";
import Close from "@mui/icons-material/Close";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import MusicNote from "@mui/icons-material/MusicNote";
import { IconButton, InputBase, Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// screen edge gaps plus the gap to the control panel
const GAPS = 16;
// narrower than this beside the control panel, the label moves under it
const MIN_WIDTH = 160;

const formatElapsed = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const useElapsed = (isRunning: boolean) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [isRunning]);
  return elapsed;
};

/**
 * The loaded song: its name, a rename on click and a close button. Red with a timer while recording.
 */
export const NowPlaying: React.FC = () => {
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const isRecording = useSettingsSelector((s) => s.isRecording);
  const recordTarget = useSettingsSelector((s) => s.recordTarget);
  const nowPlaying = useSettingsSelector((s) => s.nowPlaying);
  const theme = useUiSelector((s) => s.theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const loadedSong = useLoadedSong();
  const elapsed = useElapsed(isRecording);
  const dispatch = useDispatch();
  const [draftName, setDraftName] = useState<string>();
  const [controlPanel, setControlPanel] = useState({ width: 0, height: 0 });
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const element = document.getElementById(CONTROL_PANEL_ID);
    if (element === null) {
      return;
    }
    // The page is observed too, so the first entry can be the page instead of the panel.
    const observer = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      setControlPanel({ width, height });
      setScreenWidth(window.innerWidth);
    });
    observer.observe(element);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  const name = loadedSong?.name ?? (isPlaying ? nowPlaying : undefined);
  if (!isRecording && name === undefined) {
    return null;
  }

  const intoTrack = recordTarget === RecordTarget.NewTrack && !!loadedSong;
  const canRename = !isRecording && loadedSong?.example.isUserSong === true;

  const close = async () => {
    setPianoRollData(undefined, dispatch);
    dispatch(setPianoRollExpanded(false));
    // after the data is gone, so nothing replays it
    if (isPlayingValue) {
      const { stopPlayback } = await import("@/app/engine/midiPlayer");
      await stopPlayback(dispatch, "NowPlaying: ");
      stopMetronomeIfIdle(dispatch);
    }
  };

  const saveName = async () => {
    const newName = draftName?.trim();
    setDraftName(undefined);
    if (
      !loadedSong ||
      newName === undefined ||
      newName === "" ||
      newName === loadedSong.name
    ) {
      return;
    }
    const { renameUserSong } = await import("@/app/engine/songs/songLibrary");
    await renameUserSong(loadedSong.example, newName);
  };

  const besideWidth = screenWidth - controlPanel.width - GAPS;
  const isBeside = besideWidth >= MIN_WIDTH;
  const textColor =
    theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark";

  const renderLabel = () => {
    if (isRecording) {
      return (
        <span className="truncate">
          {intoTrack ? `New track · ${name}` : "New song"}
        </span>
      );
    }
    if (draftName !== undefined) {
      return (
        <InputBase
          autoFocus
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={() => void saveName()}
          onKeyDown={(event) => {
            // Space would start playback
            event.stopPropagation();
            if (event.key === "Enter") {
              (event.target as HTMLInputElement).blur();
            }
            if (event.key === "Escape") {
              setDraftName(undefined);
            }
          }}
          inputProps={{ "aria-label": "Song name" }}
          sx={{ fontSize: "inherit", color: "inherit", minWidth: 0, flex: 1 }}
        />
      );
    }
    return (
      <Tooltip title={canRename ? `${name}. Click to rename` : name}>
        <span
          className={`truncate ${canRename ? "cursor-text" : ""}`}
          onClick={canRename ? () => setDraftName(name) : undefined}
        >
          {name}
        </span>
      </Tooltip>
    );
  };

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
      <div
        className={`flex min-w-0 items-center gap-1 px-1 text-sm ${textColor}`}
        aria-live="polite"
      >
        {isRecording ? (
          <>
            <FiberManualRecord
              fontSize="small"
              color="error"
              className="animate-pulse"
            />
            <span className="tabular-nums">{formatElapsed(elapsed)}</span>
          </>
        ) : (
          <MusicNote fontSize="small" />
        )}
        {renderLabel()}
        {!isRecording && loadedSong && (
          <Tooltip title="Close the song">
            <IconButton
              size="small"
              aria-label="Close the song"
              onClick={() => void close()}
              sx={{ padding: "2px", color: "inherit" }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Panel>
  );
};
