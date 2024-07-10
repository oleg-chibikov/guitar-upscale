import { usePianoRollData } from "@/app/hooks/usePianoRollData";
import Download from "@mui/icons-material/Download";
import React from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const DownloadMidiButton: React.FC = () => {
  const dataToPlay = usePianoRollData();
  if (dataToPlay === undefined) {
    return null;
  }
  return (
    <>
      <IconButtonWrapper
        tooltip={"Download Midi"}
        icon={<Download />}
        onPress={async () => {
          const midiRecorder = (
            await import("@/app/engine/midiRecorder/midiRecorder")
          ).midiRecorder;
          midiRecorder.startRecording();
          midiRecorder.initializeStartTick(0);
          midiRecorder.addEvents(dataToPlay);
          midiRecorder.stopRecording(true);
        }}
      />
    </>
  );
};
