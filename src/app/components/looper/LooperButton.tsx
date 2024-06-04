import {
  CanSetLooperState,
  LooperChannelState,
  looperState,
  setPlayingInLooperChannel,
  setRecordingInLooperChannel,
  startMetronomeIfNeeded,
  stopMetronomeIfNeeded,
} from "@/app/engine/looper";
import { IconButton } from "../settings/buttons/IconButton";

import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import StopCircle from "@mui/icons-material/StopCircle";
import { useDispatch } from "react-redux";

interface LooperButtonProps extends CanSetLooperState {
  channel: number;
  state: LooperChannelState;
  showPlay: boolean;
}

export const LooperButton: React.FC<LooperButtonProps> = ({
  channel,
  state: { isRecording, isPlaying, hasRecording },
  setState,
  showPlay,
}) => {
  const dispatch = useDispatch();
  const handleRecordClick = () => {
    const shouldRecord = !looperState[channel].isRecording;
    if (shouldRecord) {
      setRecordingInLooperChannel(channel, true);
      startMetronomeIfNeeded(dispatch);
    } else {
      setRecordingInLooperChannel(channel, false);
      stopMetronomeIfNeeded(dispatch);
    }

    setState({ ...looperState });
  };

  const handlePlayPauseClick = () => {
    const shouldPlay = !looperState[channel].isPlaying;
    if (shouldPlay) {
      setPlayingInLooperChannel(channel, true);
      startMetronomeIfNeeded(dispatch);
    } else {
      setPlayingInLooperChannel(channel, false);
      stopMetronomeIfNeeded(dispatch);
    }
    setState({ ...looperState });
  };

  const isDisabled = !hasRecording;

  return (
    <div className="flex flex-col gap-1 items-center">
      <IconButton
        icon={isRecording ? <StopCircle /> : <FiberManualRecord />}
        isActive={isRecording}
        tooltip={
          isRecording
            ? "Stop recording loop at channel " + (channel + 1)
            : "Record loop at channel " + (channel + 1)
        }
        activeBg="bg-red-500"
        onPress={() => {
          handleRecordClick();
        }}
      />
      {showPlay ? (
        <IconButton
          icon={isPlaying ? <Pause /> : <PlayArrow />}
          disabled={isDisabled}
          activeBg="bg-green-500"
          isActive={isPlaying || hasRecording}
          tooltip={
            isPlaying
              ? "Pause loop at channel " + (channel + 1)
              : "Play loop at channel " + (channel + 1)
          }
          onPress={() => {
            if (isDisabled) {
              return;
            }
            handlePlayPauseClick();
          }}
        />
      ) : null}
    </div>
  );
};
