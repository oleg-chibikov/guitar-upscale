import { ValueDialogControlDialogWrapper } from "@/app/components/uiFramework/ValueDialogControlDialogWrapper";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import React, { ReactNode, useEffect, useState } from "react";

interface ValueDialogControlProps {
  value: number;
  setValue: (value: number) => void;
  steps: number[];
  icon: ReactNode;
  label: string;
  postfix?: string;
}

export interface ValueDialogControlDialogProps extends Omit<
  ValueDialogControlProps,
  "icon"
> {
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
  const theme = useUiSelector((s) => s.theme);
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
    event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>,
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
        className={`flex h-[34px] shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-[10px] border px-2 text-sm whitespace-nowrap ${
          theme === Theme.Light
            ? "border-control_border-light bg-control-light text-foreground-light"
            : "border-control_border-dark bg-control-dark text-foreground-dark"
        } ${highlight ? "highlight" : ""}`}
      >
        <div className="flex">{icon}</div>
        <div className="flex flex-row items-baseline gap-1">
          <span className="font-semibold">{value}</span>
          {postfix !== undefined && (
            <span className="text-xs opacity-70">{postfix}</span>
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
