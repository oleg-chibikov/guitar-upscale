"use client";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { AlertType } from "@/app/data/alertType";
import { getExampleName } from "@/app/data/example";
import { SONG_FILE_ACCEPT } from "@/app/data/song";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setAndShowAlert } from "@/app/store/uiSlice";
import UploadFile from "@mui/icons-material/UploadFile";
import React, { Fragment, useRef, useState } from "react";
import { useDispatch } from "react-redux";

const LOG_PREFIX = "Song upload button: ";

export const SongUploadButton: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const chordsAreLoading = useSettingsSelector((s) => s.chordsAreLoading);
  const scaleDetectorAvailable = useSettingsSelector(
    (s) => s.scaleDetectorAvailable
  );

  // the scale detector picks the scale each song goes under
  const disabled = isAdding || scaleDetectorAvailable === undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (ref.current) {
      ref.current.value = ""; // allows selecting the same file
    }
    if (disabled || !files.length) {
      return;
    }
    setIsAdding(true);
    try {
      const { addUserSongs, songPlayRequests } = await import(
        "@/app/engine/songs/songLibrary"
      );
      const added = await addUserSongs(files);
      const first = added.at(0);
      if (first === undefined) {
        return;
      }
      dispatch(
        setAndShowAlert({
          message:
            added.length === 1
              ? `Added ${getExampleName(first)} to ${first.scale} (${
                  first.scaleGroup
                })`
              : `Added ${added.length} songs. Hold Play to pick one`,
          alertType: AlertType.Success,
        })
      );
      songPlayRequests.next(first);
    } catch (error) {
      console.error(LOG_PREFIX + "Cannot add the song", error);
      dispatch(
        setAndShowAlert({
          message: `Cannot add the song: ${
            error instanceof Error ? error.message : String(error)
          }`,
          alertType: AlertType.Error,
        })
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Fragment>
      <input
        ref={ref}
        className="hidden"
        accept={SONG_FILE_ACCEPT}
        multiple
        type="file"
        onChange={(e) => void handleFileChange(e)}
      />
      <IconButtonWrapper
        disabled={disabled}
        icon={<UploadFile />}
        onPress={() => {
          ref.current?.click();
        }}
        tooltip={
          isAdding
            ? "Adding the songs..."
            : chordsAreLoading
            ? "Add Guitar Pro or MIDI songs (chords are still loading)"
            : "Add Guitar Pro or MIDI songs"
        }
      />
    </Fragment>
  );
};
