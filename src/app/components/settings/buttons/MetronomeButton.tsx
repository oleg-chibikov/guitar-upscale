import { MetronomeEventBus } from "@/app/engine/eventBus";
import {
  isMetronomeActiveValue,
  metronomeVolumeValue,
  selectSettings,
  setIsMetronomeActive,
} from "@/app/store/settingsSlice";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export function MdiMetronome() {
  return (
    <svg
      className="inline-block"
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24"
    >
      <path
        fill="currentColor"
        d="m12 1.75l-3.43.92l-4.51 16.86c-.03.15-.06.31-.06.47c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2c0-.16-.03-.32-.06-.47l-1.36-5.11L17 16l.2 1h-3.79l2.84-2.84l-1.41-1.41L10.59 17H6.8l3.49-13h3.42l1.46 5.43l1.63-1.64l-1.37-5.12zM11.25 5v9.75l1.5-1.5V5zm8.54 2.8l-2.83 2.83l-.71-.71l-1.41 1.42l2.82 2.82l1.42-1.41l-.71-.71l2.83-2.83z"
      ></path>
    </svg>
  );
}

export const MetronomeButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { isMetronomeActive } = useSelector(selectSettings);

  useEffect(() => {
    const sub = MetronomeEventBus.subscribe(async ({ isBar, isBeat }) => {
      if (isMetronomeActiveValue) {
        // console.log("Metronome sound", isBeat, isBar);
        const playMetronomeBeat = (
          await import("@/app/engine/sound/metronomeProvider")
        ).playMetronomeBeat;
        if (isBar) {
          await playMetronomeBeat(true, metronomeVolumeValue);
        } else if (isBeat) {
          await playMetronomeBeat(false, metronomeVolumeValue);
        }
      }
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handleTogglePlay = async () => {
    dispatch(setIsMetronomeActive(!isMetronomeActiveValue));
  };

  return (
    <IconButton
      {...props}
      tooltip={isMetronomeActive ? "Stop metronome" : "Start metronome"}
      isActive={isMetronomeActive}
      onPress={handleTogglePlay}
      icon={<MdiMetronome />}
    />
  );
};
