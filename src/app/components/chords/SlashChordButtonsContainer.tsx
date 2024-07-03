import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { NOTE_COUNT, Note } from "@/app/data/notes";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { setSlashChordBassNote } from "@/app/store/settingsSlice";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, Drawer, IconButton } from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";

const DRAWER_WIDTH = 30;
const TOGGLE_WIDTH = 20;
export const SlashChordButtonsContainer = () => {
  const dispatch = useDispatch();
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const slashChordBassNote = useSettingsSelector((s) => s.slashChordBassNote);
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const isLeft = chordsDisplayMode === ChordsDisplayMode.Left;

  return (
    <Box className="h-full">
      <Box
        onClick={toggleDrawer}
        sx={{
          position: "absolute",
          top: 0,
          [isLeft ? "left" : "right"]: open ? DRAWER_WIDTH : 0,
          width: TOGGLE_WIDTH,
          height: "100%",
          backgroundColor: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        <IconButton size="small" sx={{ color: "white", p: 0 }}>
          {isLeft ? (
            open ? (
              <ChevronLeftIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )
          ) : open ? (
            <ChevronRightIcon fontSize="small" />
          ) : (
            <ChevronLeftIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Drawer
        anchor={isLeft ? "left" : "right"}
        open={open}
        onClose={toggleDrawer}
        variant="persistent"
        sx={{
          width: open ? TOGGLE_WIDTH + DRAWER_WIDTH : TOGGLE_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            position: "absolute",
            height: "100%",
            width: DRAWER_WIDTH,
            overflow: "hidden",
          },
        }}
      >
        <Box className="flex items-stretch flex-col gap-1 overflow-auto h-full w-full">
          {Array.from({ length: NOTE_COUNT }, (_, index) => (
            <Button
              className="h-5"
              key={index}
              variant={slashChordBassNote === index ? "contained" : "outlined"}
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
