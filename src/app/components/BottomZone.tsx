import { AspectRatioButton } from "@/app/components/aspectRatio/AspectRatioButton";
import { PlayPanel } from "@/app/components/playPanel/PlayPanel";
import { BarDivider } from "@/app/components/uiFramework/BarDivider";
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
  const looper = premiumComponents.get("looper") as ReactNode;

  return (
    <Panel
      className={`fixed bottom-1 ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
      style={{
        maxWidth: "calc(100vw - 8px)",
        // should be displayed over the dialog
        ...(pianoRollExpanded ? { zIndex: 9999999 } : {}),
      }}
    >
      <PlayPanel premiumComponents={premiumComponents} />
      {!pianoRollExpanded && (
        <>
          {looper !== undefined && looper !== null && (
            <>
              <BarDivider />
              {looper}
            </>
          )}
          <BarDivider />
          <AspectRatioButton />
        </>
      )}
    </Panel>
  );
};
