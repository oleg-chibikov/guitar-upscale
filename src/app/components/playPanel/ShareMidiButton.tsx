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
  return (
    <IconButtonWrapper
      tooltip={"Share Midi"}
      icon={<Share />}
      onPress={async () => {
        const midiRecorder = (
          await import("@/app/engine/midiRecorder/midiRecorder")
        ).midiRecorder;
        midiRecorder.startRecording();
        midiRecorder.initializeStartTick(0);
        midiRecorder.addEvents(dataToPlay);
        const file = midiRecorder.getMidiFile();
        midiRecorder.stopRecording(false);

        const showAlert = (message: string) => {
          dispatch(
            setAndShowAlert({
              message,
              alertType: AlertType.Error,
            })
          );
        };

        if (!file) {
          showAlert("No MIDI data available");
          return;
        }

        try {
          await navigator.share({
            title: "Share Example",
            text: "Check out this file!",
            files: [file],
          });
        } catch (e: unknown) {
          console.error(e);
          showAlert(`Error sharing file: ${e}`);
        }
      }}
    />
  );
};
