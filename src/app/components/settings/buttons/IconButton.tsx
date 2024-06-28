import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import {
  IconButton,
  IconButtonProps as MuiIconButtonProps,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { ReactNode } from "react";

type MuiIconButtonColor = MuiIconButtonProps["color"];

export interface IconButtonWrapperProps extends WithClassName, WithId {
  onPress: () => void;
  textContent?: string;
  icon: ReactNode;
  isActive?: boolean;
  activeBg?: MuiIconButtonColor;
  inactiveBg?: MuiIconButtonColor;
  tooltip: string;
  disabled?: boolean;
  allowHandlerInDisabledState?: boolean;
}

export const IconButtonWrapper: React.FC<IconButtonWrapperProps> = ({
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
  const getColor = (): MuiIconButtonProps["color"] => {
    if (disabled) {
      return "default";
    }
    if (isActive) {
      return activeBg || "primary";
    }
    return inactiveBg || "default";
  };

  return (
    <div
      className={`${className} flex items-center justify-center ${
        textContent ? "relative" : ""
      }`}
    >
      <Tooltip title={tooltip}>
        <IconButton
          id={id}
          disabled={allowHandlerInDisabledState !== true && disabled}
          onClick={onPress}
          color={getColor()}
          size="small"
          sx={{
            borderRadius: 0,
            padding: "4px",
          }}
          {...rest}
        >
          {textContent && (
            <Typography
              variant="caption"
              className={`z-40 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
            >
              {textContent}
            </Typography>
          )}
          {icon}
        </IconButton>
      </Tooltip>
    </div>
  );
};
