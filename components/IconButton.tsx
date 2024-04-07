import React from "react";
import { Pressable, PressableProps, Text, TextStyle } from "react-native";
import { tw } from "../tailwind";

export interface IconButtonProps extends PressableProps {
  onPress: () => void;
  icon: string;
  textStyle?: TextStyle;
  bg: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  textStyle,
  bg,
  ...rest
}) => {
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
