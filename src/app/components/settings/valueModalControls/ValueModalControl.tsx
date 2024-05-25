import { StepSlider } from "@/app/components/settings/sliders/StepSlider";
import { Theme } from "@/app/data/theme";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { selectUi } from "@/app/store/uiSlice";
import { Box, Fade, Modal } from "@mui/material";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface ValueModalControlProps {
  value: number;
  setValue: (value: number) => void;
  steps: number[];
  icon: ReactNode;
  label: string;
  postfix?: string;
}

export const ValueModalControl: React.FC<ValueModalControlProps> = ({
  value,
  setValue,
  steps,
  icon,
  label,
  postfix,
}) => {
  const { theme } = useSelector(selectUi);
  const [modalOpen, setModalOpen] = useState(false);
  const [startPosition, setStartPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [startIndex, setStartIndex] = useState<number>(steps.indexOf(value));

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
      setModalOpen(false);
      setStartPosition(null);
    };

    if (modalOpen && startPosition) {
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
  }, [
    modalOpen,
    startPosition,
    handleMouseMove,
    handleTouchMove,
    hasTouchInput,
  ]);

  const handleTextFieldClick = (
    event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) => {
    const { clientX, clientY } = "touches" in event ? event.touches[0] : event;
    setStartPosition({ x: clientX, y: clientY });
    setStartIndex(steps.indexOf(value));
    setModalOpen(true);
  };

  return (
    <div className="relative">
      <div
        onMouseDown={hasTouchInput ? undefined : handleTextFieldClick}
        onTouchStart={!hasTouchInput ? undefined : handleTextFieldClick}
        className={`flex flex-row gap-1 justify-between items-center w-16 p-1 ${
          theme === Theme.Light
            ? "bg-select_background-light"
            : "bg-select_background-dark"
        } text-sm h-8 cursor-pointer`}
      >
        <div>{icon}</div>
        <div className="flex flex-col items-center gap-1 leading-none">
          <div>{value}</div>
          <div style={{ fontSize: 9 }}>{postfix}</div>
        </div>
      </div>
      <Modal
        open={modalOpen}
        className="cursor-move"
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        closeAfterTransition
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={modalOpen} mountOnEnter unmountOnExit>
          <Box
            className={`absolute text-center text-sm top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-72 p-4 ${
              theme === Theme.Light
                ? "bg-panel-light text-foreground-light"
                : "bg-panel-dark text-foreground-dark"
            } shadow-xl transition-opacity duration-300 ${
              modalOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <strong>{label}</strong>
            <div>
              {(hasTouchInput ? "Swipe" : "Move the mouse") +
                " around while pressed"}
            </div>
            <StepSlider
              onValueChange={() => null}
              value={value}
              steps={steps}
              label={value + (postfix !== undefined ? " " + postfix : "")}
              labelClass="w-20"
            />
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};
