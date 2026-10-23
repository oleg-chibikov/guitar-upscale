import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { NOTE_COUNT, Note } from "@/app/data/notes";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { setSlashChordBassNote } from "@/app/store/settingsSlice";
import { setSlashChordsExpanded } from "@/app/store/uiSlice";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, Drawer, IconButton, Typography } from "@mui/material";
import { useMemo } from "react";
import { useDispatch } from "react-redux";

const DRAWER_WIDTH = 32;
const TOGGLE_WIDTH = 20;
export const SlashChordButtonsContainer = () => {
  const dispatch = useDispatch();
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const slashChordsExpanded = useUiSelector((s) => s.slashChordsExpanded);
  const slashChordBassNote = useSettingsSelector((s) => s.slashChordBassNote);
  const neck = useSettingsSelector((s) => s.neck);
  // the neck only holds notes of the current scale
  const notesInKey = useMemo(
    () => new Set(neck?.flat().map((x) => x?.note)),
    [neck],
  );

  const toggleDrawer = () => {
    dispatch(setSlashChordsExpanded(!slashChordsExpanded));
  };

  const isLeft = chordsDisplayMode === ChordsDisplayMode.Left;

  return (
    <Box className="h-full">
      <Box
        sx={{
          position: "absolute",
          top: 0,
          [isLeft ? "left" : "right"]: slashChordsExpanded ? DRAWER_WIDTH : 0,
          width: TOGGLE_WIDTH,
          height: "100%",
          backgroundColor: "primary.main",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          zIndex: 100,
          padding: "10px 0",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            writingMode: "vertical-rl",
            textOrientation: "upright",
            letterSpacing: "0.1em",
          }}
        >
          Bass
        </Typography>

        <IconButton size="small" sx={{ p: 0 }} onClick={toggleDrawer}>
          {isLeft ? (
            slashChordsExpanded ? (
              <ChevronLeftIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )
          ) : slashChordsExpanded ? (
            <ChevronRightIcon fontSize="small" />
          ) : (
            <ChevronLeftIcon fontSize="small" />
          )}
        </IconButton>

        <Typography
          variant="overline"
          sx={{
            writingMode: "vertical-rl",
            textOrientation: "upright",
            letterSpacing: "0.1em",
          }}
        >
          note
        </Typography>
      </Box>
      <Drawer
        anchor={isLeft ? "left" : "right"}
        open={slashChordsExpanded}
        onClose={toggleDrawer}
        variant="persistent"
        sx={{
          width: slashChordsExpanded
            ? TOGGLE_WIDTH + DRAWER_WIDTH
            : TOGGLE_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            position: "absolute",
            height: "100%",
            width: DRAWER_WIDTH,
            overflow: "hidden",
          },
        }}
      >
        <Box className="flex h-full w-full flex-col items-stretch gap-1 overflow-auto">
          {Array.from({ length: NOTE_COUNT }, (_, index) => (
            <Button
              className="h-5"
              key={index}
              variant={slashChordBassNote === index ? "contained" : "outlined"}
              disabled={!notesInKey.has(index) && slashChordBassNote !== index}
              onClick={() => dispatch(setSlashChordBassNote(index))}
              size="small"
            >
              {Note[index]}
            </Button>
          ))}
        </Box>
      </Drawer>
    </Box>
  );
};
