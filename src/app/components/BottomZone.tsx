import { AspectRatioButton } from "@/app/components/aspectRatio/AspectRatioButton";
import { LooperToggleButton } from "@/app/components/looper/LooperToggleButton";
import { PlayPanel } from "@/app/components/playPanel/PlayPanel";
import { BarDivider } from "@/app/components/uiFramework/BarDivider";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setBottomBarHeight } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import { ReactNode, useCallback } from "react";
import { useDispatch } from "react-redux";

// the inner bare panels hand their buttons to the frame, so a long bar wraps button by button
const WRAPPING_PANEL = "pointer-events-auto max-w-full [&>section]:contents";

export const BottomZone: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const looperExpanded = useUiSelector((s) => s.looperExpanded);
  const looper = premiumComponents.get("looper") as ReactNode;
  const hasLooper = looper !== undefined && looper !== null;
  // the buttons sit on the side away from the chords
  const chordsOnLeft = chordsDisplayMode === ChordsDisplayMode.Left;
  const dispatch = useDispatch();

  const observeHeight = useCallback(
    (element: HTMLElement | null) => {
      if (element === null) {
        return;
      }
      const observer = new ResizeObserver(([entry]) =>
        dispatch(
          setBottomBarHeight(Math.ceil(entry.borderBoxSize[0].blockSize)),
        ),
      );
      observer.observe(element);
      return () => {
        observer.disconnect();
        dispatch(setBottomBarHeight(0));
      };
    },
    [dispatch],
  );

  return (
    <div
      className={`pointer-events-none fixed inset-x-1 bottom-1 flex flex-col gap-1 ${
        chordsOnLeft ? "items-end" : "items-start"
      }`}
      style={
        // should be displayed over the dialog
        pianoRollExpanded ? { zIndex: 9999999 } : undefined
      }
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
      <Panel
        ref={observeHeight}
        className={`${WRAPPING_PANEL} w-full flex-wrap-reverse ${
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
  );
};
