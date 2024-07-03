import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { MAX_VOLUME } from "@/app/data/volume";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setMetronomeVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { Slider } from "../../uiFramework/Slider";

export const MetronomeVolumeSlider: React.FC = () => {
  const metronomeVolume = useSettingsSelector((s) => s.metronomeVolume);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setMetronomeVolume(value));
    const playMetronomeBeat = (
      await import("@/app/engine/sound/metronomeProvider")
    ).playMetronomeBeat;
    await playMetronomeBeat(true, value);
  };

  return (
    <ControlWithLabel label="Metronome volume">
      <Slider
        onValueChange={handleSliderChange}
        value={metronomeVolume}
        minimumValue={1}
        maximumValue={MAX_VOLUME}
        step={1}
        label={metronomeVolume.toString()}
      />
    </ControlWithLabel>
  );
};
