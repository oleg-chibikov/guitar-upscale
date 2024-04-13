import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { ScaleObject, scalesMap } from "../../../data/scales";
import {
  selectControlPanel,
  setScale,
  setScaleGroup,
} from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";

export const ScaleSelector: React.FC = () => {
  const { scale, scaleGroup, bg, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const scales = scalesMap;

  return (
    <View
      style={[
        tw`${bg} opacity-95 p-1 gap-1`,
        {
          maxWidth: 200,
          display: "grid",
          gridTemplateColumns: "auto minmax(200px, auto)",
        },
      ]}
    >
      <Text style={textStyle}>Style:</Text>
      <Picker
        style={tw`text-md`}
        selectedValue={scaleGroup}
        onValueChange={(value) => {
          dispatch(setScaleGroup(value));
        }}
      >
        {Array.from(scales.entries()).map((scale, index) => (
          <Picker.Item key={index} label={scale[0]} value={scale[0]} />
        ))}
      </Picker>
      {scaleGroup && (
        <>
          <Text style={textStyle}>Scale:</Text>
          <Picker
            style={tw`text-md`}
            selectedValue={scale}
            onValueChange={(value) => {
              dispatch(setScale(value));
            }}
          >
            {Array.from(scales.get(scaleGroup)!.entries()).map(
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
