import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// only load module when expanded
const ScaleDetectionAlert = dynamic(
  async () => (await import("./ScaleDetectionAlert")).ScaleDetectionAlert
);

export const ScaleDetectionAlertWrapper: FC = () => {
  const [opened, setOpened] = useState(false);
  const { showScalesAlert } = useSelector(selectUi);
  useEffect(() => {
    if (showScalesAlert) {
      setOpened(true);
    }
  }, [showScalesAlert]);
  if (!opened) {
    return null;
  }

  return <ScaleDetectionAlert />;
};
