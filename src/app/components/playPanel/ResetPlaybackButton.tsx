"use client";
import { ConfirmationDialog } from "@/app/components/uiFramework/ConfirmationDialog";
import { EventsByTick } from "@/app/engine/eventsByTick";
import {
  pianoRollData,
  setPianoRollData,
} from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { isPlayingValue } from "@/app/store/settingsSlice";
import Clear from "@mui/icons-material/Clear";
import React, { Dispatch, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { UnknownAction } from "redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const ResetPlayButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const [dataToPlay, setDataToPlay] = useState<EventsByTick | undefined>();
  useEffect(() => {
    setDataToPlay(pianoRollData);
  }, [isPlaying]);
  if (dataToPlay === undefined) {
    return null;
  }
  const handleReset = async () => {
    setOpen(false);
    setPianoRollData(undefined);
    setDataToPlay(undefined);
    // must be after setting data to undefined
    if (isPlayingValue) {
      await stop(dispatch);
    }
  };
  return (
    <>
      <IconButtonWrapper
        isActive={false}
        tooltip={"Reset playback"}
        icon={<Clear />}
        inactiveBg="error"
        onPress={handleClickOpen}
      />
      <ConfirmationDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleReset}
        title="Confirm reset"
        content="Are you sure you want to reset the playback? The current melody will be lost. This action cannot be undone."
      />
    </>
  );
};

async function stop(dispatch: Dispatch<UnknownAction>) {
  const { stopPlayback } = await import("@/app/engine/midiPlayer");
  await stopPlayback(dispatch, "ResetPlayButton: ");
}
