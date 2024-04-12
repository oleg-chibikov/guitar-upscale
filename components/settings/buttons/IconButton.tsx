import { MaterialIcons } from "@expo/vector-icons";
import Icons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, PressableProps } from "react-native";
import { useSelector } from "react-redux";
import { selectControlPanel } from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";

export interface IconButtonProps extends PressableProps {
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  isActive?: boolean;
  activeBg?: string;
}

// https://materialui.co/icons
export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  isActive = false,
  activeBg,
  ...rest
}) => {
  const { bg } = useSelector(selectControlPanel);
  return (
    <Pressable
      style={({ pressed }) => [
        tw`${
          pressed ? "bg-gray-400" : isActive ? activeBg ?? "bg-blue-400" : bg
        } opacity-95 p-1 flex items-center justify-center`,
      ]}
      onPress={onPress}
      {...rest}
    >
      <Icons name={icon} size={26} />
    </Pressable>
  );
};
