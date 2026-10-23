import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { seek } from "@/app/engine/pianoRoll/playhead";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import {
  isPlayingValue,
  stopMetronomeIfIdle,
  triggerLooperStateUpdate,
} from "@/app/store/settingsSlice";
import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

const LOG_PREFIX = "PianoRoll: ";

/**
 * Plays the shown track. A melody plays once from the playhead, unlike the main Play button that loads a new one.
 * A looper track plays as a loop, in time with the other loops.
 */
export const usePianoRollTransport = () => {
  const { data, source } = usePianoRoll();
  const isMelodyPlaying = useSettingsSelector((s) => s.isPlaying);
  const isLooperPlaying = useSettingsSelector((s) => s.isLooperPlaying);
  const looperChannel = source?.looperChannel;
  const isLoop = looperChannel !== undefined;
  const isPlaying = isLoop ? isLooperPlaying : isMelodyPlaying;
  const dispatch = useDispatch();

  const stop = useCallback(async () => {
    if (looperChannel !== undefined) {
      const { stopLooperPlayback } = await import("@/app/engine/looper/looper");
      stopLooperPlayback();
      return;
    }
    const { stopPlayback } = await import("@/app/engine/midiPlayer");
    await stopPlayback(dispatch, LOG_PREFIX);
    stopMetronomeIfIdle(dispatch);
  }, [dispatch, looperChannel]);

  const play = useCallback(async () => {
    if (data?.hasItems !== true) return;
    if (looperChannel !== undefined) {
      const { setPlayingInLooperChannel } = await import(
        "@/app/engine/looper/looper"
      );
      setPlayingInLooperChannel(looperChannel, true);
      dispatch(triggerLooperStateUpdate());
      return;
    }
    const { playMidi } = await import("@/app/engine/midiPlayer");
    await playMidi(dispatch, data, LOG_PREFIX);
  }, [data, dispatch, looperChannel]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      await stop();
    } else {
      await play();
    }
  }, [isPlaying, play, stop]);

  // a loop runs in step with the bar clock, so only the melody can jump
  const seekTo = useCallback(
    (tick: number) => {
      if (data && !isLoop) seek(data, tick, isPlayingValue);
    },
    [data, isLoop]
  );

  return useMemo(
    () => ({ isPlaying, isLoop, play, stop, togglePlay, seekTo }),
    [isPlaying, isLoop, play, stop, togglePlay, seekTo]
  );
};
