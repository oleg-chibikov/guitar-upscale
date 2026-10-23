"use client";

import { AlertType } from "@/app/data/alertType";
import { MIN_NOTES_TO_DETECT_CHORD } from "@/app/data/chordDetectorWorkerTypes";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useChordDetectorSetup } from "@/app/hooks/useChordDetectorSetup";
import {
  setChordDetectorAvailable,
  setChordIsBeingDetected,
  setScaleIsBeingDetected,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import SearchOff from "@mui/icons-material/SearchOff";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const DetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const chordsAreLoading = useSettingsSelector((s) => s.chordsAreLoading);
  const chordIsBeingDetected = useSettingsSelector(
    (s) => s.chordIsBeingDetected,
  );

  const setupChordDetector = useChordDetectorSetup();

  // let the other components know that they might use chord detector
  useEffect(() => {
    const setup = async () => {
      try {
        await setupChordDetector();
        dispatch(setChordDetectorAvailable(true));
      } catch {
        dispatch(setChordDetectorAvailable(false));
      }
    };

    void setup();
  }, [dispatch, setupChordDetector]);

  return (
    <IconButtonWrapper
      {...props}
      disabled={chordsAreLoading}
      icon={chordIsBeingDetected ? <SearchOff /> : <Troubleshoot />}
      tooltip={
        chordsAreLoading
          ? "Wait for the chords to load before detecting"
          : chordIsBeingDetected
            ? "Stop detecting chord"
            : "Detect chord"
      }
      isActive={chordIsBeingDetected}
      activeBg="error"
      onPress={() => {
        if (!chordIsBeingDetected) {
          // Only one thing can be detected at a time - either chord or scale
          dispatch(setScaleIsBeingDetected(false));
          dispatch(
            setAndShowAlert({
              message:
                "Chord is being detected. Please tap on at least " +
                MIN_NOTES_TO_DETECT_CHORD +
                " notes on different strings to detect a chord",
              alertType: AlertType.Neutral,
              alertTimeout: 5000,
            }),
          );
        }
        dispatch(setChordIsBeingDetected(!chordIsBeingDetected));
      }}
    />
  );
};
