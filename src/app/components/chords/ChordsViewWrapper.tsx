"use client";
import { selectControlPanel } from "@/app/store/controlPanelSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

// only load chords module when expanded
const ChordsView = dynamic(
  async () => (await import("./ChordsView")).ChordsView
);

interface ChordsViewWrapperProps {}

export const ChordsViewWrapper: FC<ChordsViewWrapperProps> = ({}) => {
  const { chordsExpanded } = useSelector(selectControlPanel);
  if (!chordsExpanded) {
    return null;
  }

  return <ChordsView />;
};
