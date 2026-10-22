import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { seek } from "@/app/engine/pianoRoll/playhead";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { isPlayingValue, stopMetronomeIfIdle } from "@/app/store/settingsSlice";
import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

const LOG_PREFIX = "PianoRoll: ";

/**
 * Plays the notes in the piano roll from the playhead, unlike the main Play button that loads a new melody
 */
export const usePianoRollTransport = () => {
  const { data } = usePianoRoll();
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const dispatch = useDispatch();

  const stop = useCallback(async () => {
    const { stopPlayback } = await import("@/app/engine/midiPlayer");
    await stopPlayback(dispatch, LOG_PREFIX);
    stopMetronomeIfIdle(dispatch);
  }, [dispatch]);

  const play = useCallback(async () => {
    if (data?.hasItems !== true) return;
    const { playMidi } = await import("@/app/engine/midiPlayer");
    await playMidi(dispatch, data, LOG_PREFIX);
    stopMetronomeIfIdle(dispatch);
  }, [data, dispatch]);

  const togglePlay = useCallback(async () => {
    if (isPlayingValue) {
      await stop();
    } else {
      await play();
    }
  }, [play, stop]);

  const seekTo = useCallback(
    (tick: number) => {
      if (data) seek(data, tick, isPlayingValue);
    },
    [data]
  );

  return useMemo(
    () => ({ isPlaying, play, stop, togglePlay, seekTo }),
    [isPlaying, play, stop, togglePlay, seekTo]
  );
};
