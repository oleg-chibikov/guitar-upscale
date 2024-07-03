import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import { FC } from "react";

const SettingsView = dynamic(
  async () => (await import("./SettingsView")).SettingsView
);

export const SettingsViewWrapper: FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const settingsExpanded = useUiSelector((s) => s.settingsExpanded);
  return (
    <LazyLoadWrapper
      renderComponent={() => (
        <SettingsView premiumComponents={premiumComponents} />
      )}
      isOpen={settingsExpanded}
    />
  );
};
