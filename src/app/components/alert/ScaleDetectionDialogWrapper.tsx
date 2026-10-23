import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import { FC } from "react";

const ScaleDetectionAlert = dynamic(
  async () => (await import("./ScaleDetectionDialog")).ScaleDetectionAlert,
);

export const ScaleDetectionDialogWrapper: FC = () => {
  const showScalesAlert = useUiSelector((s) => s.showScalesAlert);
  return (
    <LazyLoadWrapper
      renderComponent={() => <ScaleDetectionAlert />}
      isOpen={showScalesAlert}
    />
  );
};
