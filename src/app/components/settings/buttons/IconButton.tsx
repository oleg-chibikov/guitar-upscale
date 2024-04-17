import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Theme, selectControlPanel } from "../../../store/controlPanelSlice";

export interface IconButtonProps {
  onPress: () => void;
  icon: ReactNode;
  isActive?: boolean;
  activeBg?: string;
  inactiveBg?: string;
  tooltip: string;
  id?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  isActive = false,
  activeBg,
  inactiveBg,
  tooltip,
  id,
  ...rest
}) => {
  const { theme } = useSelector(selectControlPanel);

  return (
    <button
      id={id}
      title={tooltip}
      className={`${
        isActive
          ? activeBg ??
            (theme === Theme.Light ? "bg-button-light" : "bg-button-dark")
          : inactiveBg ??
            (theme === Theme.Light
              ? "bg-accented_background-light"
              : "bg-accented_background-dark")
      } ${
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      } opacity-95 p-1 flex items-center justify-center`}
      onClick={onPress}
      {...rest}
    >
      {icon}
    </button>
  );
};
