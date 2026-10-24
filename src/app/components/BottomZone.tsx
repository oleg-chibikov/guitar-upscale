import { AspectRatioButton } from "@/app/components/aspectRatio/AspectRatioButton";
import { LooperToggleButton } from "@/app/components/looper/LooperToggleButton";
import { PlayPanel } from "@/app/components/playPanel/PlayPanel";
import { BarDivider } from "@/app/components/uiFramework/BarDivider";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { Typography } from "@mui/material";
import { ReactNode } from "react";

// screen edge on both sides plus the gap to the chords
const CHORDS_GAP = 12;
// the inner bare panels hand their buttons to the frame, so a long bar wraps button by button
const WRAPPING_PANEL = "pointer-events-auto max-w-full [&>section]:contents";

export const BottomZone: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const looperExpanded = useUiSelector((s) => s.looperExpanded);
  const chordsWidth = useUiSelector((s) => s.chordsWidth);
  const looper = premiumComponents.get("looper") as ReactNode;
  const hasLooper = looper !== undefined && looper !== null;

  return (
    <div
      className={`pointer-events-none fixed bottom-1 flex flex-col gap-1 ${
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "right-1 items-end"
          : "left-1 items-start"
      }`}
      style={{
        maxWidth: `calc(100vw - ${chordsWidth > 0 ? chordsWidth + CHORDS_GAP : 8}px)`,
        // should be displayed over the dialog
        ...(pianoRollExpanded ? { zIndex: 9999999 } : {}),
      }}
    >
      {hasLooper && (
        // stays mounted while hidden so the loops keep their state
        <Panel
          className={`${WRAPPING_PANEL} flex-wrap`}
          style={
            looperExpanded && !pianoRollExpanded
              ? undefined
              : { display: "none" }
          }
        >
          <Typography
            variant="body2"
            sx={{ color: "text.primary", opacity: 0.75, px: 0.5 }}
          >
            Looper
          </Typography>
          {looper}
        </Panel>
      )}
      <Panel className={`${WRAPPING_PANEL} flex-wrap-reverse`}>
        <PlayPanel premiumComponents={premiumComponents} />
        {!pianoRollExpanded && (
          <>
            {hasLooper && (
              <>
                <BarDivider />
                <LooperToggleButton />
              </>
            )}
            <BarDivider />
            <AspectRatioButton />
          </>
        )}
      </Panel>
    </div>
  );
};
