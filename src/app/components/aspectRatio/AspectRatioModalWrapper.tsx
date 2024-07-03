import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import { FC } from "react";

const AspectRatioModal = dynamic(
  async () => (await import("./AspectRatioModal")).AspectRatioModal
);

export const AspectRatioModalWrapper: FC = () => {
  const showAspectRatio = useUiSelector((s) => s.showAspectRatio);
  return (
    <LazyLoadWrapper
      renderComponent={() => <AspectRatioModal />}
      isOpen={showAspectRatio}
    />
  );
};
