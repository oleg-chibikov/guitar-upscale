import { ValueDialogControlDialogWrapper } from "@/app/components/uiFramework/ValueDialogControlDialogWrapper";
import { Theme } from "@/app/data/theme";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { selectUi } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React, { ReactNode, useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface ValueDialogControlProps {
  value: number;
  setValue: (value: number) => void;
  steps: number[];
  icon: ReactNode;
  label: string;
  postfix?: string;
}

export interface ValueDialogControlDialogProps
  extends Omit<ValueDialogControlProps, "icon"> {
  startIndex: number;
  setHighlight: (value: boolean) => void;
  isOpen: boolean;
  close: () => void;
  startPosition: StartPosition;
  setStartPosition: (value: StartPosition) => void;
}

export type StartPosition = {
  x: number;
  y: number;
} | null;

export const ValueDialogControl: React.FC<ValueDialogControlProps> = ({
  value,
  setValue,
  steps,
  icon,
  label,
  postfix,
}) => {
  const { theme } = useSelector(selectUi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startPosition, setStartPosition] = useState<StartPosition>(null);
  const [startIndex, setStartIndex] = useState<number>(steps.indexOf(value));
  const [highlight, setHighlight] = useState(false);

  const hasTouchInput = useInputChecker();

  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => setHighlight(false), 1000); // Remove highlight after 1 second
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  const handleTextFieldClick = (
    event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) => {
    const { clientX, clientY } = "touches" in event ? event.touches[0] : event;
    setStartPosition({ x: clientX, y: clientY });
    setStartIndex(steps.indexOf(value));
    setDialogOpen(true);
  };

  return (
    <>
      <div
        onMouseDown={hasTouchInput ? undefined : handleTextFieldClick}
        onTouchStart={!hasTouchInput ? undefined : handleTextFieldClick}
        className={`flex flex-row gap-1 justify-around items-center w-16 p-1 ${
          theme === Theme.Light
            ? "text-select_foreground-light bg-select_background-light"
            : "text-select_foreground-dark bg-select_background-dark"
        } text-xs h-8 cursor-pointer ${highlight ? "highlight" : ""}`}
      >
        <div>{icon}</div>
        <div className="flex flex-col items-center gap-0.5 leading-none">
          <div>{value}</div>
          {postfix !== undefined && (
            <Typography lineHeight={1.1} variant="overline">
              {postfix}
            </Typography>
          )}
        </div>
      </div>
      <ValueDialogControlDialogWrapper
        value={value}
        setValue={setValue}
        steps={steps}
        label={label}
        postfix={postfix}
        startIndex={startIndex}
        setHighlight={setHighlight}
        isOpen={dialogOpen}
        close={() => setDialogOpen(false)}
        startPosition={startPosition}
        setStartPosition={setStartPosition}
      />
    </>
  );
};
