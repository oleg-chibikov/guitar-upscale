import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { MAX_VOLUME } from "@/app/data/volume";
import { selectSettings, setMetronomeVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "../../uiFramework/Slider";

export const MetronomeVolumeSlider: React.FC = () => {
  const { metronomeVolume } = useSelector(selectSettings);
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
