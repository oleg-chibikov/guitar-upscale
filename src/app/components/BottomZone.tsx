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

// the inner bare panels hand their buttons to the frame, so a long bar wraps button by button
const WRAPPING_PANEL = "pointer-events-auto max-w-full [&>section]:contents";

export const BottomZone: React.FC<
  WithPremiumComponents & { chords: ReactNode }
> = ({ premiumComponents, chords }) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const looperExpanded = useUiSelector((s) => s.looperExpanded);
  const looper = premiumComponents.get("looper") as ReactNode;
  const hasLooper = looper !== undefined && looper !== null;
  // the buttons sit on the side away from the chords
  const chordsOnLeft = chordsDisplayMode === ChordsDisplayMode.Left;

  return (
    // The bar comes first, so wrap-reverse keeps it on the bottom line. It also flips items-start to the bottom edge.
    // The chords sit next to it while both fit, and wrap above it when they don't.
    <div
      className={`pointer-events-none fixed inset-x-1 bottom-1 z-20 flex flex-wrap-reverse items-start gap-1 ${
        chordsOnLeft ? "flex-row-reverse" : "flex-row"
      }`}
      style={
        // should be displayed over the dialog
        pianoRollExpanded ? { zIndex: 9999999 } : undefined
      }
    >
      <div
        className={`relative flex min-w-0 grow flex-col gap-1 ${
          chordsOnLeft ? "items-end" : "items-start"
        }`}
      >
        {hasLooper && (
          // Stays mounted while hidden so the loops keep their state.
          // Floats above the bar, so opening it doesn't push the chords to another line.
          <Panel
            className={`${WRAPPING_PANEL} absolute bottom-full mb-1 w-max max-w-[calc(100vw-0.5rem)] flex-wrap ${
              chordsOnLeft ? "right-0" : "left-0"
            }`}
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
        <Panel
          className={`${WRAPPING_PANEL} flex-wrap-reverse ${
            chordsOnLeft ? "justify-end" : "justify-start"
          }`}
        >
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
      <div
        className={`pointer-events-auto ${chordsOnLeft ? "mr-auto" : "ml-auto"} ${
          pianoRollExpanded ? "hidden" : ""
        }`}
      >
        {chords}
      </div>
    </div>
  );
};
