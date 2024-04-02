import React from "react";
import { Pressable, PressableProps, Text, TextStyle } from "react-native";
import tw from "../tailwind";

interface IconButtonProps extends PressableProps {
  onPress: () => void;
  icon: string;
  textStyle?: TextStyle;
}

const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  textStyle,
  ...rest
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        tw`${
          pressed ? "bg-gray-400" : "bg-gray-200"
        } p-2 rounded-lg flex items-center justify-center`,
      ]}
      onPress={onPress}
      {...rest}
    >
      <Text style={[{ fontSize: 20 }, textStyle]}>{icon}</Text>
    </Pressable>
  );
};

export default IconButton;
