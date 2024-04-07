import { Picker } from "@react-native-picker/picker";
import React from "react";
import tw from "../tailwind";

interface EnumSelectorProps<T> {
  enumObj: T;
  selectedValue: T[keyof T];
  onValueChange: (value: T[keyof T]) => void;
  customLabel?: (key: string, value: unknown) => string;
}

function EnumSelector<T>({
  enumObj,
  selectedValue,
  onValueChange,
  customLabel,
}: EnumSelectorProps<T>) {
  return (
    <Picker
      style={tw`text-md`}
      selectedValue={selectedValue}
      onValueChange={(value) => {
        onValueChange(parseInt(value as any) as any);
      }}
    >
      {Object.entries(enumObj as any)
        .filter(([key]) => isNaN(key as any))
        .map(([key, value]) => (
          <Picker.Item
            key={key}
            label={customLabel?.(key, value) ?? key}
            value={value}
          />
        ))}
    </Picker>
  );
}

export default EnumSelector;
