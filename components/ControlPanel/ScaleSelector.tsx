import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Text, View } from "react-native";
import { useDispatch } from "react-redux";

import { ScaleObject, scalesMap } from "../../data/scales";
import {
  setSelectedScale,
  setSelectedScaleGroup,
} from "../../store/controlPanelSlice";
import { useAppSelector } from "../../store/store";
import { tw } from "../../tailwind";
import { WithTextStyle } from "./WithTextStyle";

export const ScaleSelector: React.FC<WithTextStyle & { bg: string }> = ({
  bg,
  textStyle,
}) => {
  const { selectedScale, selectedScaleGroup } = useAppSelector(
    (state) => state.controlPanel
  );
  const dispatch = useDispatch();

  const scales = scalesMap;

  return (
    <View
      style={[
        tw`${bg} opacity-95 p-2 rounded-md gap-2`,
        {
          display: "grid",
          gridTemplateColumns: "auto minmax(200px, auto)",
        },
      ]}
    >
      <Text style={textStyle}>Style:</Text>
      <Picker
        style={tw`text-md`}
        selectedValue={selectedScaleGroup}
        onValueChange={(value) => {
          dispatch(setSelectedScaleGroup(value));
        }}
      >
        {Array.from(scales.entries()).map((scale, index) => (
          <Picker.Item key={index} label={scale[0]} value={scale[0]} />
        ))}
      </Picker>
      {selectedScaleGroup && (
        <>
          <Text style={textStyle}>Scale:</Text>
          <Picker
            style={tw`text-md`}
            selectedValue={selectedScale}
            onValueChange={(value) => {
              dispatch(setSelectedScale(value));
            }}
          >
            {Array.from(scales.get(selectedScaleGroup)!.entries()).map(
              (scale, index) => {
                const scaleObject = scale[1];
                const hasExamples =
                  (scaleObject as ScaleObject)?.examples?.length > 0;
                return (
                  <Picker.Item
                    key={index}
                    label={scale[0] + (hasExamples ? " *" : "")}
                    value={scale[0]}
                  />
                );
              }
            )}
          </Picker>
        </>
      )}
    </View>
  );
};
