import { ConfirmationDialog } from "@/app/components/uiFramework/ConfirmationDialog";
import { setPianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { usePianoRollData } from "@/app/hooks/usePianoRollData";
import { isPlayingValue } from "@/app/store/settingsSlice";
import Clear from "@mui/icons-material/Clear";
import React, { Dispatch, useState } from "react";
import { useDispatch } from "react-redux";
import { UnknownAction } from "redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const ResetPlaybackButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();
  const dataToPlay = usePianoRollData();
  if (dataToPlay === undefined) {
    return null;
  }
  const handleReset = async () => {
    setOpen(false);
    setPianoRollData(undefined, dispatch);
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
