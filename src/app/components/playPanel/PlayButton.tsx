"use client";
import {
  Example,
  ExamplesMap,
  getExampleName,
  matchesExampleSearch,
} from "@/app/data/example";
import { PlaybackType } from "@/app/data/playbackType";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useExamples } from "@/app/hooks/useExamples";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import {
  playbackTypeValue,
  scaleGroupValue,
  scaleValue,
  setPlaybackType,
  setScale,
  setScaleGroup,
} from "@/app/store/settingsSlice";
import Delete from "@mui/icons-material/Delete";
import Download from "@mui/icons-material/Download";
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import Search from "@mui/icons-material/Search";
import {
  IconButton,
  InputAdornment,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

const getExampleChoices = (examplesMap: ExamplesMap | undefined) => {
  const choices: Example[] = [];
  examplesMap?.forEach((scales) =>
    scales.forEach((examples) => choices.push(...examples))
  );
  choices.sort((a, b) => getExampleName(a).localeCompare(getExampleName(b)));
  return choices;
};

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const examplesMap = useExamples();
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  // a song from another scale plays once the store has switched to that scale
  const pending = useRef<Example>(undefined);

  const { isWaiting, handlePlay, isPlaying } = usePlay(params);

  const startExample = useCallback(
    (choice: Example) => {
      const isSameScale =
        choice.scaleGroup === scaleGroupValue && choice.scale === scaleValue;
      if (isSameScale && playbackTypeValue === PlaybackType.Melody) {
        void handlePlay(choice);
        return;
      }
      if (playbackTypeValue !== PlaybackType.Melody) {
        dispatch(setPlaybackType(PlaybackType.Melody));
      }
      if (choice.scaleGroup !== scaleGroupValue) {
        dispatch(setScaleGroup(choice.scaleGroup));
      }
      if (choice.scale !== scaleValue) {
        dispatch(setScale(choice.scale));
      }
      pending.current = choice;
    },
    [dispatch, handlePlay]
  );

  useEffect(() => {
    const choice = pending.current;
    if (
      choice &&
      choice.scaleGroup === scaleGroup &&
      choice.scale === scale &&
      playbackType === PlaybackType.Melody
    ) {
      pending.current = undefined;
      void handlePlay(choice);
    }
  }, [scaleGroup, scale, playbackType, handlePlay]);

  useEffect(() => {
    if (!params.decodeExample) {
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let active = true;
    void import("@/app/engine/songs/songLibrary").then(
      ({ songPlayRequests }) => {
        if (active) {
          const subscription = songPlayRequests.subscribe(startExample);
          unsubscribe = () => subscription.unsubscribe();
        }
      }
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [params.decodeExample, startExample]);

  if (neck === null) {
    return null;
  }

  const choices = params.decodeExample ? getExampleChoices(examplesMap) : [];
  const canChoose = choices.length > 0;
  const shownChoices = choices.filter((choice) =>
    matchesExampleSearch(choice, search)
  );
  const isCurrent = (choice: Example) =>
    choice.scaleGroup === scaleGroup && choice.scale === scale;

  const closeMenu = () => {
    setMenuAnchor(null);
    setSearch("");
  };

  const playChosen = (choice: Example) => {
    closeMenu();
    startExample(choice);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" || event.key === "Tab") {
      return;
    }
    // MenuList jumps to the item that starts with the typed letter
    event.stopPropagation();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.currentTarget
        .closest('[role="menu"]')
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    }
  };

  const focusSearchOnDesktop = () => {
    // on a phone the keyboard would cover the list
    if (window.matchMedia("(pointer: fine)").matches) {
      searchInput.current?.focus();
    }
  };

  const downloadChosen = async (choice: Example) => {
    if (!params.decodeExample) {
      return;
    }
    const { downloadEventsAsGuitarPro } = await import(
      "@/app/engine/songs/songExport"
    );
    await downloadEventsAsGuitarPro(await params.decodeExample(choice), choice);
  };

  const removeChosen = async (choice: Example) => {
    const { removeUserSong } = await import("@/app/engine/songs/songLibrary");
    await removeUserSong(choice);
  };

  return (
    <>
      <IconButtonWrapper
        isActive={isPlaying}
        tooltip={
          isWaiting
            ? "Waiting for player to get ready..."
            : isPlaying
            ? "Replay"
            : canChoose
            ? "Play (hold to pick a song)"
            : "Play"
        }
        icon={
          isWaiting ? <HourglassTop /> : isPlaying ? <Replay /> : <PlayArrow />
        }
        onPress={() => void handlePlay()}
        onLongPress={canChoose ? setMenuAnchor : undefined}
      />
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: { maxHeight: "calc(100dvh - 32px)", maxWidth: "90vw" },
          },
          transition: { onEntered: focusSearchOnDesktop },
        }}
      >
        <ListSubheader
          sx={{
            top: 0,
            zIndex: 1,
            px: 1.5,
            py: 1,
            lineHeight: "normal",
            backgroundColor: "background.paper",
            backgroundImage: "var(--Paper-overlay)",
          }}
        >
          <TextField
            inputRef={searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search songs"
            size="small"
            fullWidth
            autoComplete="off"
            slotProps={{
              htmlInput: { "aria-label": "Search songs" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </ListSubheader>
        {shownChoices.length === 0 && (
          <MenuItem dense disabled>
            <ListItemText primary="No songs found" />
          </MenuItem>
        )}
        {shownChoices.map((choice) => (
          <MenuItem key={choice.id} dense onClick={() => playChosen(choice)}>
            <ListItemText
              primary={getExampleName(choice)}
              secondary={`${choice.scale} (${choice.scaleGroup})${
                choice.isUserSong ? ", uploaded" : ""
              }`}
              slotProps={{
                primary: isCurrent(choice)
                  ? { sx: { color: "success.main", fontWeight: "bold" } }
                  : undefined,
              }}
            />
            <IconButton
              edge={choice.isUserSong ? undefined : "end"}
              size="small"
              aria-label={`Download ${getExampleName(choice)}`}
              title="Download as Guitar Pro, in the key from the settings"
              onClick={(event) => {
                event.stopPropagation();
                void downloadChosen(choice).catch((error) =>
                  console.error("Cannot download the song", error)
                );
              }}
            >
              <Download fontSize="small" />
            </IconButton>
            {choice.isUserSong && (
              <IconButton
                edge="end"
                size="small"
                aria-label={`Delete ${getExampleName(choice)}`}
                title="Delete the uploaded song"
                onClick={(event) => {
                  event.stopPropagation();
                  void removeChosen(choice);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
