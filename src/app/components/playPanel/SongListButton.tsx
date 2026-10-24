"use client";
import {
  Example,
  RANDOM_SONG,
  SongChoice,
  getExampleName,
  matchesExampleSearch,
} from "@/app/data/example";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import Delete from "@mui/icons-material/Delete";
import Download from "@mui/icons-material/Download";
import QueueMusic from "@mui/icons-material/QueueMusic";
import Search from "@mui/icons-material/Search";
import Shuffle from "@mui/icons-material/Shuffle";
import {
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { useRef, useState } from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

interface SongListButtonProps {
  choices: Example[];
  decodeExample: (example: Example) => Promise<EventsByTick>;
  onChoose: (choice: SongChoice) => void;
}

export const SongListButton: React.FC<SongListButtonProps> = ({
  choices,
  decodeExample,
  onChoose,
}) => {
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const anchor = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const shownChoices = choices.filter((choice) =>
    matchesExampleSearch(choice, search),
  );
  const isCurrent = (choice: Example) =>
    choice.scaleGroup === scaleGroup && choice.scale === scale;
  const hasCurrentScaleSongs = choices.some(isCurrent);

  const closeMenu = () => {
    setMenuAnchor(null);
    setSearch("");
  };

  const choose = (choice: SongChoice) => {
    closeMenu();
    onChoose(choice);
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
        ?.querySelector<HTMLElement>('[role="menuitem"]:not(.Mui-disabled)')
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
    const { downloadEventsAsGuitarPro } =
      await import("@/app/engine/songs/songExport");
    await downloadEventsAsGuitarPro(await decodeExample(choice), choice);
  };

  const removeChosen = async (choice: Example) => {
    const { removeUserSong } = await import("@/app/engine/songs/songLibrary");
    await removeUserSong(choice);
  };

  return (
    <>
      <div ref={anchor}>
        <IconButtonWrapper
          tooltip="Songs"
          icon={<QueueMusic />}
          isActive={menuAnchor !== null}
          onPress={() => setMenuAnchor(anchor.current)}
        />
      </div>
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
        {search === "" && (
          <MenuItem
            dense
            disabled={!hasCurrentScaleSongs}
            onClick={() => choose(RANDOM_SONG)}
          >
            <ListItemIcon>
              <Shuffle fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Random song"
              secondary={`${scale} (${scaleGroup})`}
            />
          </MenuItem>
        )}
        {shownChoices.length === 0 && (
          <MenuItem dense disabled>
            <ListItemText primary="No songs found" />
          </MenuItem>
        )}
        {shownChoices.map((choice) => (
          <MenuItem key={choice.id} dense onClick={() => choose(choice)}>
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
                  console.error("Cannot download the song", error),
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
