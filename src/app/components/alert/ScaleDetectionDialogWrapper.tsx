import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

const ScaleDetectionAlert = dynamic(
  async () => (await import("./ScaleDetectionDialog")).ScaleDetectionAlert
);

export const ScaleDetectionDialogWrapper: FC = () => {
  const { showScalesAlert } = useSelector(selectUi);
  return (
    <LazyLoadWrapper
      renderComponent={() => <ScaleDetectionAlert />}
      isOpen={showScalesAlert}
    />
  );
};
