import { AlertType } from "@/app/data/alertType";
import { usePianoRollData } from "@/app/hooks/usePianoRollData";
import { setAndShowAlert } from "@/app/store/uiSlice";
import Share from "@mui/icons-material/Share";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const ShareMidiButton: React.FC = () => {
  const dataToPlay = usePianoRollData();
  const dispatch = useDispatch();
  if (dataToPlay === undefined) {
    return null;
  }

  const showAlert = (message: string) => {
    dispatch(
      setAndShowAlert({
        message,
        alertType: AlertType.Error,
      })
    );
  };

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      console.error("Error sharing file:", error);
      showAlert(`Error sharing file: ${error.message}`);
    } else {
      console.error("Unexpected error:", error);
      showAlert("An unexpected error occurred");
    }
  };

  return (
    <IconButtonWrapper
      tooltip={"Share Midi"}
      icon={<Share />}
      onPress={async () => {
        if (navigator.canShare === undefined) {
          showAlert("Your browser doesn't support the Web Share API");
          return;
        }
        const midiRecorder = (
          await import("@/app/engine/midiRecorder/midiRecorder")
        ).midiRecorder;
        midiRecorder.startRecording();
        midiRecorder.initializeStartTick(0);
        midiRecorder.addEvents(dataToPlay);
        const file = midiRecorder.getMidiFile();
        midiRecorder.stopRecording(false);

        if (!file) {
          showAlert("No MIDI data available");
          return;
        }
        const shareObj = {
          files: [file],
          title: "Share MIDI file",
          text: "Due to the browser restriction the file was renamed to .wav. It should be renamed to .mid by the recipient",
        };
        if (!navigator.canShare(shareObj)) {
          showAlert("Share not allowed");
        }

        try {
          await navigator.share(shareObj);
        } catch (e: unknown) {
          handleError(e);
        }
      }}
    />
  );
};
