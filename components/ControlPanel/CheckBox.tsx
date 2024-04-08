import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useSelector } from "react-redux";
import { Theme, selectControlPanel } from "../../store/controlPanelSlice";

export type Styleable = {
  style?: StyleProp<ViewStyle>;
};

export type CheckBoxProps = Styleable & {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
};

export const CheckBox: React.FC<CheckBoxProps> = ({
  label,
  value,
  onValueChange,
  style,
}) => {
  const { theme } = useSelector(selectControlPanel);
  return (
    <BouncyCheckbox
      style={style}
      size={14}
      isChecked={value}
      text={label}
      iconStyle={{ borderColor: "black" }}
      innerIconStyle={{ borderWidth: 2 }}
      textStyle={{
        color: theme === Theme.Dark ? "white" : "black",
        fontWeight: "100",
        fontSize: 14,
        textDecorationLine: "none", // disable strikethrough
      }}
      onPress={onValueChange}
    />
  );
};
