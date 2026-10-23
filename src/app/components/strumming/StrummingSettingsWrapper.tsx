import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import { FC } from "react";

const StrummingSettings = dynamic(
  async () => (await import("./StrummingSettings")).StrummingSettings,
);

export const StrummingSettingsWrapper: FC = () => {
  const strummingSettingsExpanded = useUiSelector(
    (s) => s.strummingSettingsExpanded,
  );
  return (
    <LazyLoadWrapper
      renderComponent={() => <StrummingSettings />}
      isOpen={strummingSettingsExpanded}
    />
  );
};
