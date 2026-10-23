import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import {
  IconButton,
  IconButtonProps as MuiIconButtonProps,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { MouseEvent, ReactNode, useRef } from "react";

const LONG_PRESS_MS = 500;

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
  // fires on a press held for LONG_PRESS_MS or a right click
  onLongPress?: (anchor: HTMLElement) => void;
  // the main button of a bar, drawn light on dark
  emphasis?: boolean;
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
  disabled = false,
  allowHandlerInDisabledState,
  onLongPress,
  emphasis = false,
  ...rest
}) => {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const firedLongPress = useRef(false);

  const cancelLongPress = () => clearTimeout(timer.current);

  const longPressProps = onLongPress && {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }
      firedLongPress.current = false;
      const anchor = event.currentTarget;
      timer.current = setTimeout(() => {
        firedLongPress.current = true;
        onLongPress(anchor);
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancelLongPress,
    onPointerLeave: cancelLongPress,
    onPointerCancel: cancelLongPress,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      cancelLongPress();
      if (!firedLongPress.current) {
        onLongPress(event.currentTarget);
      }
    },
  };

  const handleClick = () => {
    if (firedLongPress.current) {
      firedLongPress.current = false;
      return;
    }
    onPress();
  };

  const getColor = (): MuiIconButtonProps["color"] => {
    if (disabled) {
      return "warning";
    }
    if (isActive) {
      return activeBg || "primary";
    }
    return inactiveBg || "default";
  };

  return (
    <div className={`${className} flex items-center justify-center`}>
      <Tooltip title={tooltip}>
        {/* Span is needed here for tooltip to work when the button is disabled: check https://stackoverflow.com/questions/61115913/is-it-possible-to-render-a-tooltip-on-a-disabled-material-ui-button-within-a-but */}
        <span>
          <IconButton
            id={id}
            disabled={allowHandlerInDisabledState !== true && disabled}
            onClick={handleClick}
            color={getColor()}
            size="small"
            sx={{
              padding: "4px",
              WebkitTouchCallout: "none",
              userSelect: "none",
              ...(emphasis
                ? {
                    bgcolor: "text.primary",
                    borderColor: "text.primary",
                    color: "background.default",
                    "&:hover": { bgcolor: "text.secondary" },
                  }
                : {}),
            }}
            {...longPressProps}
            {...rest}
          >
            <div className="relative inline-flex items-center justify-center">
              {icon}
              {textContent !== undefined && (
                <Typography
                  variant="subtitle2"
                  className="absolute"
                  sx={{ color: "ButtonText" }}
                >
                  {textContent}
                </Typography>
              )}
            </div>
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
};
