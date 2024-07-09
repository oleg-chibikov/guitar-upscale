import { AspectRatioButton } from "@/app/components/aspectRatio/AspectRatioButton";
import { PianoRollToolboxPanel } from "@/app/components/pianoRoll/toolbox/PianoRollToolboxPanel";
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
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);

  return (
    <div
      className={`flex flex-row gap-1 fixed bottom-1 items-end ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
      style={pianoRollExpanded ? { zIndex: 9999999 } : undefined} // should be displayed over the dialog
    >
      {pianoRollExpanded && <PianoRollToolboxPanel />}
      <PlayPanel premiumComponents={premiumComponents} />
      {!pianoRollExpanded && (
        <>
          {premiumComponents.get("looper") as ReactNode}
          <Panel>
            <AspectRatioButton />
          </Panel>
        </>
      )}
    </div>
  );
};
