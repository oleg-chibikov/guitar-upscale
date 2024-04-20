import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { getNoteText, parseStringToNotes } from "@/app/data/notes";
import { waitForNextBeat, waitForNextTick } from "@/app/engine/mainClock";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import {
  PlaybackType,
  examplesForScale,
  isMetronomeTicking,
  selectControlPanel,
  setTempoBpm,
  showAlert,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

export const PlayButton: React.FC<WithPremiumComponents> = () => {
  const { neck, tuning, baseNote, scale, chordsMap, playbackType } =
    useSelector(selectControlPanel);

  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const [isWaiting, setIsWaiting] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  const dispatch = useDispatch();
  const { melodies } = usePremiumFeatures();

  const handlePlay = useCallback(async () => {
    if (!neck) {
      return;
    }
    if (isPlayingRef.current) {
      // If already playing, stop playback
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });
    // Start playback
    setIsWaiting(true);
    isPlayingRef.current = true;

    if (isMetronomeTicking) {
      await waitForNextBeat();
    }

    setIsWaiting(false);
    setIsPlaying(true);
    try {
      console.log("Start playing");
      const dispatchAlert = (message: string) => dispatch(showAlert(message));
      if (melodies && playbackType === melodyType && examplesForScale) {
        const playExample = (await import("@/app/engine/examplePlayer"))
          .playExample;
        await playExample(
          baseNote,
          examplesForScale,
          waitForNextTick,
          neck,
          parseStringToNotes(tuning),
          isPlayingRef,
          dispatchAlert,
          (x) => dispatch(setTempoBpm(x))
        );
      } else {
        const isFullStringScalePlayback = playbackType === fullStringScaleType;
        dispatchAlert(
          `${getNoteText(baseNote)} ${scale} ${
            isFullStringScalePlayback ? " (full string)" : ""
          }`
        );
        const playWholeScale = (await import("@/app/engine/player"))
          .playWholeScale;
        await playWholeScale(
          waitForNextTick,
          neck,
          isPlayingRef,
          isFullStringScalePlayback
        );
      }
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [baseNote, dispatch, melodies, neck, playbackType, scale, tuning]);

  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [neck, tuning, baseNote, scale, playbackType]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        // Call your function here
        handlePlay();
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("keydown", handleKeyPress);

    // Remove event listener when the component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handlePlay]); // Empty dependency array ensures that this effect runs only once, similar to componentDidMount

  if (!neck) {
    return null;
  }
  if (!chordsMap) {
    return null;
  }

  return (
    <IconButton
      isActive={isPlaying}
      tooltip={
        isWaiting
          ? "Waiting for the next beat..."
          : isPlaying
          ? "Stop playing scale"
          : "Play scale"
      }
      icon={
        isWaiting ? <HourglassTopIcon /> : isPlaying ? <Pause /> : <PlayArrow />
      }
      onPress={handlePlay}
    />
  );
};
