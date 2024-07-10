import { LooperState } from "@/app/engine/looper/looper";
import { IconButtonWrapper } from "../uiFramework/IconButton";

import Download from "@mui/icons-material/Download";

interface SaveLooperMelodyButtonProps {
  state: LooperState;
}

export const SaveLooperRecordingButton: React.FC<
  SaveLooperMelodyButtonProps
> = ({ state }) => {
  const handleSave = async () => {
    const channels = Object.values(state).filter((x) => x.hasRecording);
    const midiRecorder = (
      await import("@/app/engine/midiRecorder/midiRecorder")
    ).midiRecorder;
    midiRecorder.startRecording();
    midiRecorder.initializeStartTick(0);
    channels
      .map((x) => x.looperRecorder)
      .forEach((looperRecorder) => {
        looperRecorder.addAllItemsToNoteRecorder(midiRecorder);
      });

    midiRecorder.stopRecording(true);
  };

  return (
    <IconButtonWrapper
      icon={<Download />}
      isActive={true}
      tooltip={"Combine recording from all channels and save as a MIDI file"}
      onPress={handleSave}
    />
  );
};
