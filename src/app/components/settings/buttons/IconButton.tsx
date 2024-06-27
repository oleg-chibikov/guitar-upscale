import { Theme } from "@/app/data/theme";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { selectUi } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React, { ReactNode } from "react";
import { useSelector } from "react-redux";

export interface IconButtonProps extends WithClassName, WithId {
  onPress: () => void;
  textContent?: string;
  icon: ReactNode;
  isActive?: boolean;
  activeBg?: string;
  inactiveBg?: string;
  tooltip: string;
  disabled?: boolean;
  allowHandlerInDisabledState?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  textContent,
  icon,
  isActive = false,
  activeBg,
  inactiveBg,
  tooltip,
  id,
  className,
  disabled,
  allowHandlerInDisabledState,
  ...rest
}) => {
  const hasTouchInput = useInputChecker();
  const { theme } = useSelector(selectUi);

  // this allows clicking the buttons while the other buttons are being pressed (for example, during strumming)
  const clickAttrs = {
    onTouchStartCapture: async () => {
      if (hasTouchInput) {
        await onPress();
      }
    },
    onMouseDownCapture: async () => {
      if (!hasTouchInput) {
        await onPress();
      }
    },
  };

  return (
    <button
      id={id}
      title={tooltip}
      disabled={allowHandlerInDisabledState !== true && disabled}
      className={`${className} ${
        disabled === true
          ? theme === Theme.Light
            ? "bg-disabled-light"
            : "bg-disabled-dark"
          : isActive
          ? activeBg ??
            (theme === Theme.Light ? "bg-button-light" : "bg-button-dark")
          : inactiveBg ??
            (theme === Theme.Light
              ? "bg-accented_background-light"
              : "bg-accented_background-dark")
      } ${
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      } opacity-95 p-1 flex items-center justify-center ${
        textContent ? "relative" : ""
      }`}
      {...clickAttrs}
      {...rest}
    >
      {textContent && (
        <Typography
          className={` ${
            theme === Theme.Light
              ? "text-background-light"
              : "text-background-dark"
          } z-40 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
        >
          {textContent}
        </Typography>
      )}
      {icon}
    </button>
  );
};
