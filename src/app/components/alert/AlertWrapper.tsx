"use client";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// only load chords module when expanded
const Alert = dynamic(async () => (await import("./Alert")).Alert);

interface AlertWrapperProps {}

export const AlertWrapper: FC<AlertWrapperProps> = ({}) => {
  const [opened, setOpened] = useState(false);
  const { showAlert } = useSelector(selectUi);
  useEffect(() => {
    if (showAlert) {
      setOpened(true);
    }
  }, [showAlert]);
  if (!opened) {
    return null;
  }

  return <Alert />;
};
