import {
  CanSetLooperState,
  LooperChannelState,
  looperState,
  setPlayingInLooperChannel,
  setRecordingInLooperChannel,
  startMetronomeIfNeeded,
  stopMetronomeIfNeeded,
} from "@/app/engine/looper/looper";
import { IconButtonWrapper } from "../uiFramework/IconButton";

import { checkLooperPlaying } from "@/app/engine/looper/looperShared";
import { stopMetronomeIfIdle } from "@/app/store/settingsSlice";
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

  const handlePlayPauseClick = async () => {
    const shouldPlay = !looperState[channel].isPlaying;
    if (shouldPlay) {
      setPlayingInLooperChannel(channel, true);
      startMetronomeIfNeeded(dispatch);

      if (!checkLooperPlaying()) {
        // Stop any other playback when looper starts
        const { stopPlayback } = await import("@/app/engine/midiPlayer");
        await stopPlayback(dispatch, "Looper button");
      }
    } else {
      setPlayingInLooperChannel(channel, false);
      stopMetronomeIfIdle(dispatch);
    }
    setState({ ...looperState });
  };

  const isDisabled = !hasRecording;

  return (
    <div className="flex flex-col gap-1 items-center">
      <IconButtonWrapper
        icon={isRecording ? <StopCircle /> : <FiberManualRecord />}
        isActive={isRecording}
        tooltip={
          isRecording
            ? "Stop recording loop at channel " + (channel + 1)
            : "Record loop at channel " + (channel + 1)
        }
        activeBg="error"
        onPress={handleRecordClick}
        textContent={isRecording ? undefined : (channel + 1).toString()}
      />
      {showPlay ? (
        <IconButtonWrapper
          icon={isPlaying ? <Pause /> : <PlayArrow />}
          disabled={isDisabled}
          activeBg={isPlaying ? "success" : undefined}
          isActive={isPlaying || hasRecording}
          tooltip={
            isPlaying
              ? `Pause loop at channel ${channel + 1}`
              : `Play loop at channel ${channel + 1}`
          }
          onPress={async () => {
            if (isDisabled) {
              return;
            }
            await handlePlayPauseClick();
          }}
        />
      ) : null}
    </div>
  );
};
