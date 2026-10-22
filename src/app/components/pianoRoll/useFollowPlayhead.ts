import { PITCH_AXIS_WIDTH } from "@/app/data/pianoRollConstants";
import { tickToX, Zoom } from "@/app/engine/pianoRoll/geometry";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import {
  usePianoRollSelector,
  useSettingsSelector,
} from "@/app/hooks/storeHooks";
import { RefObject, useEffect } from "react";

// the playhead turns the page a little before it reaches the edge
const PAGE_MARGIN_PX = 40;

/**
 * Turns the page when the playhead leaves the view during playback, as Cubase's autoscroll does
 */
export const useFollowPlayhead = (
  scrollerRef: RefObject<HTMLDivElement | null>,
  zoom: Zoom
) => {
  const followPlayback = usePianoRollSelector((s) => s.followPlayback);
  const { playhead$, source } = usePianoRoll();
  const isMelodyPlaying = useSettingsSelector((s) => s.isPlaying);
  const isLooperPlaying = useSettingsSelector((s) => s.isLooperPlaying);
  const isPlaying =
    source?.looperChannel !== undefined ? isLooperPlaying : isMelodyPlaying;

  useEffect(() => {
    if (!followPlayback || !isPlaying) return;
    const subscription = playhead$.subscribe((tick) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const x = tickToX(tick, zoom);
      const viewStart = scroller.scrollLeft;
      const viewWidth = scroller.clientWidth - PITCH_AXIS_WIDTH;
      if (x < viewStart || x > viewStart + viewWidth - PAGE_MARGIN_PX) {
        scroller.scrollLeft = x - PAGE_MARGIN_PX;
      }
    });
    return () => subscription.unsubscribe();
  }, [followPlayback, isPlaying, scrollerRef, zoom, playhead$]);
};
