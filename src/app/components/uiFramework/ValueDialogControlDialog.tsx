import { ValueDialogControlDialogProps } from "@/app/components/uiFramework/ValueDialogControl";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { Alert } from "@mui/material";
import React, { useCallback, useEffect } from "react";
import { DialogWrapper } from "./DialogWrapper";
import { StepSlider } from "./StepSlider";

export const ValueDialogControlDialog: React.FC<
  ValueDialogControlDialogProps
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
      dialogClassName="cursor-move"
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
