import { TimeSignature } from "@/app/data/clockConstants";
import { WithClassName } from "@/app/helpers/withClassName";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setQuantize } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../uiFramework/EnumSelector";

// a state saved before quantize came in has no value until the settings load
export const useQuantize = () =>
  useSettingsSelector((s) => s.quantize) ?? TimeSignature.SIXTEENTH;

/**
 * The quantize length shared by the piano roll, the recording and the looper
 */
export const QuantizeSelector: React.FC<WithClassName> = ({ className }) => {
  const quantize = useQuantize();
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={TimeSignature}
      className={className}
      tooltip="Quantize: the note length that Q, the recording and the looper snap to"
      selectedValue={quantize}
      onValueChange={(value) => dispatch(setQuantize(value))}
      customLabel={(_key, value) => `Q ${value}`}
    />
  );
};
