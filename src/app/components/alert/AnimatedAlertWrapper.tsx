"use client";
import { selectControlPanel } from "@/app/store/controlPanelSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

// only load chords module when expanded
const AnimatedAlert = dynamic(
  async () => (await import("./AnimatedAlert")).AnimatedAlert
);

interface AnimatedAlertWrapperProps {}

export const AnimatedAlertWrapper: FC<AnimatedAlertWrapperProps> = ({}) => {
  const { showAlert } = useSelector(selectControlPanel);
  if (!showAlert) {
    return null;
  }

  return <AnimatedAlert />;
};
