"use client";

import { AlertType } from "@/app/data/alertType";
import { CHROMATIC, SPECIAL } from "@/app/data/scales";
import { getShiftedNote } from "@/app/data/tunings";
import { describeKey } from "@/app/helpers/keyDescription";
import { MIN_NOTES_TO_DETECT_SCALE } from "@/app/engine/scales/scaleDetector";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useScaleDetectorSetup } from "@/app/hooks/useScaleDetectorSetup";
import {
  capoValue,
  scaleGroupValue,
  scaleValue,
  setChordIsBeingDetected,
  setScale,
  setScaleDetectorAvailable,
  setScaleGroup,
  setScaleIsBeingDetected,
  tuningValue,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import ManageSearch from "@mui/icons-material/ManageSearch";
import SearchOff from "@mui/icons-material/SearchOff";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

// the scale before detection switched to chromatic. Kept outside the button, as the picker closes
let scaleBeforeDetection: { scaleGroup: string; scale: string } | undefined;

export const DetectScaleButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const scaleIsBeingDetected = useSettingsSelector(
    (s) => s.scaleIsBeingDetected,
  );
  const setupScaleDetector = useScaleDetectorSetup();

  // let the other components know that they might use scale detector
  useEffect(() => {
    const setup = async () => {
      try {
        await setupScaleDetector();
        dispatch(setScaleDetectorAvailable(true));
      } catch {
        dispatch(setScaleDetectorAvailable(false));
      }
    };

    void setup();
  }, [dispatch, setupScaleDetector]);

  return (
    <IconButtonWrapper
      {...props}
      icon={scaleIsBeingDetected ? <SearchOff /> : <ManageSearch />}
      tooltip={scaleIsBeingDetected ? "Stop detecting scale" : "Detect scale"}
      isActive={scaleIsBeingDetected}
      activeBg="error"
      onPress={async () => {
        if (!scaleIsBeingDetected) {
          // Only one thing can be detected at a time - either chord or scale
          dispatch(setChordIsBeingDetected(false));
          scaleBeforeDetection = {
            scaleGroup: scaleGroupValue,
            scale: scaleValue,
          };
          dispatch(setScaleGroup(SPECIAL));
          dispatch(setScale(CHROMATIC));
          dispatch(
            setAndShowAlert({
              message: `Tap ${MIN_NOTES_TO_DETECT_SCALE} or more notes on the neck. All notes show while detecting.`,
              alertType: AlertType.Neutral,
              alertTimeout: 5000,
            }),
          );
        } else if (
          scaleBeforeDetection !== undefined &&
          scaleBeforeDetection.scale !== CHROMATIC &&
          scaleGroupValue === SPECIAL &&
          scaleValue === CHROMATIC
        ) {
          // no scale was picked, so the old one comes back
          const { scaleGroup, scale } = scaleBeforeDetection;
          dispatch(setScaleGroup(scaleGroup));
          dispatch(setScale(scale));
          const { title, details } = describeKey({
            root: getShiftedNote(capoValue, tuningValue),
            scaleGroup,
            scale,
            tuningName: "",
            capo: 0,
          });
          dispatch(
            setAndShowAlert({
              message: `Back to ${title}, ${details}`,
              alertType: AlertType.Neutral,
            }),
          );
        }
        if (scaleIsBeingDetected) {
          scaleBeforeDetection = undefined;
        }
        dispatch(setScaleIsBeingDetected(!scaleIsBeingDetected));
      }}
    />
  );
};
