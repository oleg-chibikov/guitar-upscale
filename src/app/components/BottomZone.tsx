import { AspectRatioButton } from "@/app/components/aspectRatio/AspectRatioButton";
import { PlayPanel } from "@/app/components/playPanel/PlayPanel";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import { ReactNode } from "react";
import { useSelector } from "react-redux";

export const BottomZone: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { chordsDisplayMode } = useSelector(selectUi);

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
