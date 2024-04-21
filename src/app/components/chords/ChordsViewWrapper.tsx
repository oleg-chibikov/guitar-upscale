"use client";
import { selectControlPanel } from "@/app/store/controlPanelSlice";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// only load chords module when expanded
const ChordsView = dynamic(
  async () => (await import("./ChordsView")).ChordsView
);

interface ChordsViewWrapperProps {}

export const ChordsViewWrapper: FC<ChordsViewWrapperProps> = ({}) => {
  const [opened, setOpened] = useState(false);
  const { chordsExpanded } = useSelector(selectControlPanel);
  useEffect(() => {
    if (chordsExpanded) {
      setOpened(true);
    }
  }, [chordsExpanded]);
  if (!opened) {
    return null;
  }

  return <ChordsView />;
};
