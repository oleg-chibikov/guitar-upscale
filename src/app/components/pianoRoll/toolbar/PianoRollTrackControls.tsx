import { getTrackColor } from "@/app/components/pianoRoll/pianoRollDrawing";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { SelectWrapper } from "@/app/components/uiFramework/SelectWrapper";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import DriveFileRenameOutline from "@mui/icons-material/DriveFileRenameOutline";
import Headphones from "@mui/icons-material/Headphones";
import PlaylistAdd from "@mui/icons-material/PlaylistAdd";
import PlaylistRemove from "@mui/icons-material/PlaylistRemove";
import { TextField } from "@mui/material";
import React, { useRef, useState } from "react";

const ALL_TRACKS = "all";

export const PianoRollTrackControls: React.FC = () => {
  const {
    tracks,
    activeTrack,
    setActiveTrack,
    addTrack,
    deleteTrack,
    renameTrack,
    solo,
    toggleSolo,
  } = usePianoRoll();
  const [renaming, setRenaming] = useState(false);
  const cancelled = useRef(false);

  const startRename = () => {
    cancelled.current = false;
    setRenaming(true);
  };

  const finishRename = (name: string) => {
    if (activeTrack && !cancelled.current) renameTrack(activeTrack, name);
    setRenaming(false);
  };

  return (
    <div className="flex flex-row items-center">
      {renaming && activeTrack ? (
        <TextField
          size="small"
          autoFocus
          defaultValue={activeTrack.label}
          placeholder="Track name"
          className="w-36"
          slotProps={{ htmlInput: { className: "py-1 text-sm" } }}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => finishRename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== "Escape") return;
            // Escape stays in the field instead of closing the piano roll
            e.stopPropagation();
            cancelled.current = e.key === "Escape";
            (e.target as HTMLInputElement).blur();
          }}
        />
      ) : (
        tracks.length > 0 && (
          <SelectWrapper
            className="min-w-28"
            tooltip="Track to edit (T). The other tracks stay in view, dimmed. Press a dimmed note to edit its track"
            options={[
              { value: ALL_TRACKS, label: "All tracks" },
              ...tracks.map(({ trackNumber, label }, index) => ({
                value: trackNumber,
                label,
                color: getTrackColor(index),
              })),
            ]}
            value={activeTrack?.trackNumber ?? ALL_TRACKS}
            onChange={(value) =>
              setActiveTrack(value === ALL_TRACKS ? undefined : Number(value))
            }
          />
        )
      )}
      <IconButtonWrapper
        icon={<Headphones />}
        tooltip={
          activeTrack
            ? solo
              ? "Play every track (S)"
              : "Play only this track (S)"
            : "Pick a track to play it alone (S)"
        }
        onPress={toggleSolo}
        disabled={!activeTrack}
        isActive={solo && activeTrack !== undefined}
      />
      <IconButtonWrapper
        icon={<PlaylistAdd />}
        tooltip="Add a track"
        onPress={addTrack}
      />
      <IconButtonWrapper
        icon={<DriveFileRenameOutline />}
        tooltip={activeTrack ? "Rename the track" : "Pick a track to rename it"}
        onPress={startRename}
        disabled={!activeTrack}
        isActive={renaming}
      />
      <IconButtonWrapper
        icon={<PlaylistRemove />}
        tooltip={
          activeTrack
            ? "Delete the track and its notes. Undo brings the notes back"
            : "Pick a track to delete it"
        }
        onPress={() => activeTrack && deleteTrack(activeTrack)}
        disabled={!activeTrack}
      />
    </div>
  );
};
