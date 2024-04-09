import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { ScaleObject, scalesMap } from "../../data/scales";
import {
  selectControlPanel,
  setSelectedScale,
  setSelectedScaleGroup,
} from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";

export const ScaleSelector: React.FC = () => {
  const { selectedScale, selectedScaleGroup, bg, textStyle } =
    useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const scales = scalesMap;

  return (
    <View
      style={[
        tw`${bg} opacity-95 p-1 gap-1`,
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
