import { DialogWrapper } from "@/app/components/layout/DialogWrapper";
import { StepSlider } from "@/app/components/settings/sliders/StepSlider";
import {
  StartPosition,
  ValueModalControlProps,
} from "@/app/components/settings/valueModalControls/ValueModalControl";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { selectUi } from "@/app/store/uiSlice";
import { Alert } from "@mui/material";
import React, { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";

interface ValueModalControlDialogProps
  extends Omit<ValueModalControlProps, "icon"> {
  startIndex: number;
  setHighlight: (value: boolean) => void;
  isOpen: boolean;
  close: () => void;
  startPosition: StartPosition;
  setStartPosition: (value: StartPosition) => void;
}

export const ValueModalControlDialog: React.FC<
  ValueModalControlDialogProps
> = ({
  value,
  setValue,
  steps,
  label,
  postfix,
  startIndex,
  setHighlight,
  isOpen,
  close,
  startPosition,
  setStartPosition,
}) => {
  const { theme } = useSelector(selectUi);
  const hasTouchInput = useInputChecker();

  const handleMove = useCallback(
    (x: number, y: number) => {
      if (startPosition) {
        const deltaX = x - startPosition.x;
        const deltaY = y - startPosition.y;
        const deltaValue = deltaX / 10 - deltaY / 10;
        let newIndex = startIndex + Math.round(deltaValue);
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= steps.length) newIndex = steps.length - 1;
        setValue(steps[newIndex]);
        setHighlight(true); // Trigger highlight
      }
    },
    [startPosition, startIndex, steps, setValue]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => handleMove(event.clientX, event.clientY),
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    },
    [handleMove]
  );

  useEffect(() => {
    const handleMouseUp = () => {
      close();
      setStartPosition(null);
    };

    if (isOpen && startPosition) {
      if (hasTouchInput) {
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleMouseUp);
      } else {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
    }

    return () => {
      if (hasTouchInput) {
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleMouseUp);
      } else {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [isOpen, startPosition, handleMouseMove, handleTouchMove, hasTouchInput]);

  return (
    <DialogWrapper
      darkBackdrop
      isOpen={isOpen}
      className="cursor-move"
      close={close}
      headerText={label}
    >
      <Alert severity="info">
        {`${hasTouchInput ? "Swipe" : "Move the mouse"} around while pressed`}
      </Alert>
      <StepSlider
        onValueChange={() => null}
        value={value}
        steps={steps}
        label={value + (postfix !== undefined ? ` ${postfix}` : "")}
        labelClass="w-20"
      />
    </DialogWrapper>
  );
};
