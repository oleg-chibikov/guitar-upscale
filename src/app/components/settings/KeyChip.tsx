"use client";

import { CapoSelector } from "@/app/components/settings/selectors/CapoSelector";
import { ScaleGroupSelector } from "@/app/components/settings/selectors/ScaleGroupSelector";
import { ScaleSelector } from "@/app/components/settings/selectors/ScaleSelector";
import { TuningSelector } from "@/app/components/settings/selectors/TuningSelector";
import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { getShiftedNote, tunings } from "@/app/data/tunings";
import { getPalette } from "@/app/helpers/canvas/palette";
import { describeKey } from "@/app/helpers/keyDescription";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Button, Popover, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import React, { useState } from "react";

const DisabledDetectScaleButton = dynamic(
  async () =>
    (
      await import("@/app/components/settings/buttons/DisabledDetectScaleButton")
    ).DisabledDetectScaleButton,
);

/**
 * Shows the key in words. A press opens the scale, tuning and capo pickers and scale detection.
 */
export const KeyChip: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const theme = useUiSelector((s) => s.theme);
  const palette = getPalette(theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const tuning = useSettingsSelector((s) => s.tuning);
  const capo = useSettingsSelector((s) => s.capo);
  const scaleIsBeingDetected = useSettingsSelector(
    (s) => s.scaleIsBeingDetected,
  );
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [wasDetecting, setWasDetecting] = useState(scaleIsBeingDetected);

  // detection needs taps on the fretboard, so the pickers get out of the way
  if (wasDetecting !== scaleIsBeingDetected) {
    setWasDetecting(scaleIsBeingDetected);
    if (scaleIsBeingDetected) {
      setAnchor(null);
    }
  }

  const { title, details } = describeKey({
    root: getShiftedNote(capo, tuning),
    scaleGroup,
    scale,
    tuningName: tunings[tuning]?.name ?? tuning,
    capo,
  });
  // the panel sits on the side opposite the chords
  const side = chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left";

  return (
    <>
      <Button
        variant="contained"
        disableElevation
        color={scaleIsBeingDetected ? "error" : "primary"}
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ExpandMore />}
        sx={{
          textTransform: "none",
          borderRadius: "20px",
          height: 36,
          py: 0,
          px: 1.75,
          maxWidth: "min(240px, calc(100vw - 72px))",
          flexShrink: 0,
          justifyContent: "space-between",
          ...(scaleIsBeingDetected
            ? {}
            : {
                bgcolor: palette.key,
                color: palette.keyForeground,
                "&:hover": { bgcolor: palette.key, filter: "brightness(1.1)" },
              }),
        }}
      >
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="max-w-full truncate font-semibold">
            {scaleIsBeingDetected ? "Detecting scale" : title}
          </span>
          <span className="max-w-full truncate text-xs opacity-80">
            {scaleIsBeingDetected ? "Tap notes on the neck" : details}
          </span>
        </span>
      </Button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        keepMounted // scale detection sets itself up on mount
        anchorOrigin={{ vertical: "bottom", horizontal: side }}
        transformOrigin={{ vertical: "top", horizontal: side }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: "14px",
              border: `1px solid ${palette.barBorder}`,
              bgcolor: palette.bar,
              backgroundImage: "none",
            },
          },
        }}
      >
        <section
          className={`grid items-center gap-2.5 p-4 ${
            theme === Theme.Light
              ? "text-foreground-light"
              : "text-foreground-dark"
          }`}
          style={{ gridTemplateColumns: "auto minmax(180px, 1fr)" }}
        >
          <ControlWithLabel label="Style">
            <ScaleGroupSelector />
          </ControlWithLabel>
          {scaleGroup && (
            <ControlWithLabel label="Scale">
              <ScaleSelector />
            </ControlWithLabel>
          )}
          <ControlWithLabel label="Tuning">
            <TuningSelector />
          </ControlWithLabel>
          <ControlWithLabel label="Capo">
            <CapoSelector />
          </ControlWithLabel>
          <div className="col-span-2 flex flex-row items-center gap-2 pt-1">
            {premiumComponents.get("scaleDetection") ?? (
              <DisabledDetectScaleButton />
            )}
            <Typography variant="body2">
              Find the scale from notes you tap
            </Typography>
          </div>
        </section>
      </Popover>
    </>
  );
};
