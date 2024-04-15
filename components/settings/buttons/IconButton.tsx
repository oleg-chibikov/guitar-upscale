import { MaterialIcons } from "@expo/vector-icons";
import Icons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, PressableProps } from "react-native";
import { Tooltip } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectControlPanel } from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";

export interface IconButtonProps extends PressableProps {
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  isActive?: boolean;
  activeBg?: string;
  inactiveBg?: string;
  tooltip: string;
}

// https://materialui.co/icons
export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  isActive = false,
  activeBg,
  inactiveBg,
  tooltip,
  ...rest
}) => {
  const { bg } = useSelector(selectControlPanel);
  return (
    <Tooltip title={tooltip}>
      <Pressable
        style={({ pressed }) => [
          tw`${
            pressed
              ? "bg-gray-400"
              : isActive
              ? activeBg ?? "bg-blue-400"
              : inactiveBg ?? bg
          } opacity-95 p-1 flex items-center justify-center`,
        ]}
        onPress={onPress}
        {...rest}
      >
        <Icons name={icon} size={17} />
      </Pressable>
    </Tooltip>
  );
};
