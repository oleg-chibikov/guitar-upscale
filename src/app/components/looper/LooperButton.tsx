import { IconButton } from "@/app/settings/buttons/IconButton";
import { useState } from "react";

import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import StopCircle from "@mui/icons-material/StopCircle";

export const LooperButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleRecordClick = () => {
    if (isRecording) {
      // TODO: Wait for the bar to end
      setIsPlaying(true);
    }
    setIsRecording(!isRecording);
  };

  const handlePlayPauseClick = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col items-center">
      <IconButton
        icon={isRecording ? <StopCircle /> : <FiberManualRecord />}
        isActive={isRecording}
        tooltip={isRecording ? "Stop recording loop" : "Record loop"}
        activeBg="bg-red-500"
        onPress={() => {
          handleRecordClick();
        }}
      />
      <IconButton
        icon={isPlaying ? <Pause /> : <PlayArrow />}
        isActive={isPlaying}
        tooltip={isPlaying ? "Pause loop" : "Play loop"}
        onPress={() => {
          handlePlayPauseClick();
        }}
      />
    </div>
  );
};
