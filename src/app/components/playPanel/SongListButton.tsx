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
import CloudDownload from "@mui/icons-material/CloudDownload";
import Delete from "@mui/icons-material/Delete";
import Download from "@mui/icons-material/Download";
import LibraryMusic from "@mui/icons-material/LibraryMusic";
import Person from "@mui/icons-material/Person";
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
import dynamic from "next/dynamic";
import React, { useRef, useState } from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

const SongsterrImportDialog = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/SongsterrImportDialog"))
      .SongsterrImportDialog,
);

const groupLabelSx = {
  lineHeight: "28px",
  backgroundColor: "transparent",
  fontSize: 12,
};

interface SongListButtonProps {
  choices: Example[];
  canImportSongs: boolean;
  decodeExample: (example: Example) => Promise<EventsByTick>;
  onChoose: (choice: SongChoice) => void;
}

export const SongListButton: React.FC<SongListButtonProps> = ({
  choices,
  canImportSongs,
  decodeExample,
  onChoose,
}) => {
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const scaleDetectorAvailable = useSettingsSelector(
    (s) => s.scaleDetectorAvailable,
  );
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  // the search text the Songsterr dialog opened with, undefined while it is closed
  const [songsterrQuery, setSongsterrQuery] = useState<string>();
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

  const openSongsterr = () => {
    setSongsterrQuery(search.trim());
    closeMenu();
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

  // the person's songs come first: they can be renamed and deleted
  const songGroups = [
    { label: "Your songs", songs: shownChoices.filter((c) => c.isUserSong) },
    {
      label: "Built-in songs",
      songs: shownChoices.filter((c) => !c.isUserSong),
    },
  ];
  const showGroupLabels = songGroups[0].songs.length > 0;

  const renderSong = (choice: Example) => (
    <MenuItem key={choice.id} dense onClick={() => choose(choice)}>
      <ListItemIcon>
        {choice.isUserSong ? (
          <Person fontSize="small" color="primary" titleAccess="Your song" />
        ) : (
          <LibraryMusic
            fontSize="small"
            color="disabled"
            titleAccess="Built-in song"
          />
        )}
      </ListItemIcon>
      <ListItemText
        primary={getExampleName(choice)}
        secondary={`${choice.scale} (${choice.scaleGroup})`}
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
          title="Delete your song"
          onClick={(event) => {
            event.stopPropagation();
            void removeChosen(choice);
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      )}
    </MenuItem>
  );

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
        {canImportSongs && (
          <MenuItem
            dense
            // the scale detector picks the scale each song goes under
            disabled={scaleDetectorAvailable === undefined}
            onClick={openSongsterr}
          >
            <ListItemIcon>
              <CloudDownload fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Add from Songsterr"
              secondary={
                search.trim() === ""
                  ? "Search Songsterr for a song"
                  : `Search Songsterr for "${search.trim()}"`
              }
            />
          </MenuItem>
        )}
        {songGroups.flatMap(({ label, songs }) =>
          songs.length === 0
            ? []
            : [
                ...(showGroupLabels
                  ? [
                      <ListSubheader
                        key={label}
                        disableSticky
                        sx={groupLabelSx}
                      >
                        {label}
                      </ListSubheader>,
                    ]
                  : []),
                ...songs.map(renderSong),
              ],
        )}
      </Menu>
      {songsterrQuery !== undefined && (
        <SongsterrImportDialog
          isOpen
          initialQuery={songsterrQuery}
          handleCloseDialog={() => setSongsterrQuery(undefined)}
        />
      )}
    </>
  );
};
