import { MetronomeEventBus } from "@/app/engine/eventBus";
import React, { useEffect, useState } from "react";
import {
  metronomeVelocityValue,
  setMetronomeTicking,
} from "../../../store/settingsSlice";
import { IconButton } from "./IconButton";

function MdiMetronome() {
  return (
    <svg
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
  const [isTicking, setIsTicking] = useState(false);

  useEffect(() => {
    setMetronomeTicking(isTicking);
    const sub = MetronomeEventBus.subscribe(async ({ isBeat, tick }) => {
      if (isTicking) {
        const playMetronomeTick = (
          await import("@/app/engine/sound/metronomeProvider")
        ).playMetronomeTick;
        if (isBeat) {
          await playMetronomeTick(true, metronomeVelocityValue ?? 80);
        } else if (tick % 2 === 0) {
          await playMetronomeTick(false, metronomeVelocityValue ?? 80);
        }
      }
    });
    return () => {
      sub.unsubscribe();
    };
  }, [isTicking]);

  const handleTogglePlay = () => {
    setIsTicking((prevState) => !prevState);
  };

  return (
    <IconButton
      {...props}
      tooltip={isTicking ? "Stop metronome" : "Start metronome"}
      isActive={isTicking}
      onPress={handleTogglePlay}
      icon={<MdiMetronome />}
    />
  );
};
