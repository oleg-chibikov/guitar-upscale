import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

const SettingsView = dynamic(
  async () => (await import("./SettingsView")).SettingsView
);

export const SettingsViewWrapper: FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { settingsExpanded } = useSelector(selectUi);
  return (
    <LazyLoadWrapper
      renderComponent={() => (
        <SettingsView premiumComponents={premiumComponents} />
      )}
      isOpen={settingsExpanded}
    />
  );
};
