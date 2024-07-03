import { AspectRatioButton } from "@/app/components/aspectRatio/AspectRatioButton";
import { PlayPanel } from "@/app/components/playPanel/PlayPanel";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { ReactNode } from "react";

export const BottomZone: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);

  return (
    <div
      className={`flex flex-row gap-1 fixed bottom-1 items-end ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
    >
      <PlayPanel premiumComponents={premiumComponents} />
      {premiumComponents.get("looper") as ReactNode}
      <Panel>
        <AspectRatioButton />
      </Panel>
    </div>
  );
};
