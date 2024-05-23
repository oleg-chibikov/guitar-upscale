import {
  LooperChannelState,
  LooperState,
  looperState,
  setPlayingInLooperChannel,
  setRecordingInLooperChannel,
} from "@/app/engine/looper";
import { IconButton } from "../settings/buttons/IconButton";

import {
  currentlyPlayingLooperChannels,
  currentlyRecordingLooperChannel,
} from "@/app/engine/looperShared";
import {
  isMetronomeActiveValue,
  setIsMetronomeActive,
  toggleMetronomeWhenRecordingValue,
} from "@/app/store/settingsSlice";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import StopCircle from "@mui/icons-material/StopCircle";
import { useDispatch } from "react-redux";

interface LooperButtonProps {
  channel: number;
  state: LooperChannelState;
  setState: (state: LooperState) => void; // it allows setting state for adjacent channels
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
      startMetronome();
    } else {
      setRecordingInLooperChannel(channel, false);
      stopMetronome();
    }

    setState({ ...looperState });
  };

  const handlePlayPauseClick = () => {
    const shouldPlay = !looperState[channel].isPlaying;
    if (shouldPlay) {
      setPlayingInLooperChannel(channel, true);
      startMetronome();
    } else {
      setPlayingInLooperChannel(channel, false);
      stopMetronome();
    }
    setState({ ...looperState });
  };

  const startMetronome = () => {
    if (toggleMetronomeWhenRecordingValue && !isMetronomeActiveValue) {
      dispatch(setIsMetronomeActive(true));
    }
  };

  const stopMetronome = () => {
    if (
      toggleMetronomeWhenRecordingValue &&
      isMetronomeActiveValue &&
      !currentlyPlayingLooperChannels.size && // nothing else should play or record to stop
      currentlyRecordingLooperChannel === undefined
    ) {
      dispatch(setIsMetronomeActive(false));
    }
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
