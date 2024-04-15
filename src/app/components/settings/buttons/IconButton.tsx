import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { selectControlPanel } from "../../../store/controlPanelSlice";

export interface IconButtonProps {
  onPress: () => void;
  icon: ReactNode;
  isActive?: boolean;
  activeBg?: string;
  inactiveBg?: string;
  tooltip: string;
}

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
    <button
      title={tooltip}
      className={`${
        isActive ? activeBg ?? "bg-blue-400" : inactiveBg ?? bg
      } opacity-95 p-1 flex items-center justify-center`}
      onClick={onPress}
      {...rest}
    >
      {icon}
    </button>
  );
};
