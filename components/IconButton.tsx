import React from "react";
import { Pressable, PressableProps, Text } from "react-native";
import { useSelector } from "react-redux";
import { selectControlPanel } from "../store/controlPanelSlice";
import { tw } from "../tailwind";

export interface IconButtonProps extends PressableProps {
  onPress: () => void;
  icon: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  ...rest
}) => {
  const { textStyle, bg } = useSelector(selectControlPanel);
  return (
    <Pressable
      style={({ pressed }) => [
        tw`${
          pressed ? "bg-gray-400" : bg
        } opacity-95 p-2 rounded-lg flex items-center justify-center`,
      ]}
      onPress={onPress}
      {...rest}
    >
      <Text style={[{ fontSize: 20 }, textStyle]}>{icon}</Text>
    </Pressable>
  );
};
