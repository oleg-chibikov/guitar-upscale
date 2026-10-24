import { StrummingPattern } from "@/app/data/strummingPatterns";
import {
  getAllPatterns,
  loadPatternsFromLocalStorage,
} from "@/app/engine/strummingPatternsStorage";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setStrummingPatternId } from "@/app/store/settingsSlice";
import { setStrummingPatternEditorExpanded } from "@/app/store/uiSlice";
import Edit from "@mui/icons-material/Edit";
import SwapVert from "@mui/icons-material/SwapVert";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import React, { useRef, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

const GROUP_SIZE = 4;

const PatternPreview: React.FC<{ pattern: StrummingPattern }> = ({
  pattern,
}) => (
  <div className="flex flex-row gap-1.5 font-mono">
    {Array.from(
      { length: Math.ceil(pattern.strums.length / GROUP_SIZE) },
      (_, group) => (
        <div key={group} className="flex flex-row">
          {pattern.strums
            .slice(group * GROUP_SIZE, (group + 1) * GROUP_SIZE)
            .map((strum, index) => (
              <span
                key={index}
                className="flex h-5 w-4 items-center justify-center border-b border-current text-sm"
                style={{ opacity: strum ? 1 : 0.35 }}
              >
                {strum}
              </span>
            ))}
        </div>
      ),
    )}
  </div>
);

export const StrummingPatternButton: React.FC = () => {
  const dispatch = useDispatch();
  const strummingPatternId = useSettingsSelector((s) => s.strummingPatternId);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [patterns, setPatterns] = useState<StrummingPattern[]>([]);
  const anchor = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    // custom patterns are only read from local storage on demand
    loadPatternsFromLocalStorage();
    setPatterns(getAllPatterns());
    setMenuAnchor(anchor.current);
    ReactGA.event({
      category: "Settings",
      action: "Open strumming pattern menu",
    });
  };

  const closeMenu = () => setMenuAnchor(null);

  const choose = (id: number) => {
    dispatch(setStrummingPatternId(id));
    closeMenu();
  };

  const openEditor = () => {
    closeMenu();
    dispatch(setStrummingPatternEditorExpanded(true));
  };

  return (
    <>
      <div ref={anchor}>
        <IconButtonWrapper
          tooltip="Strumming pattern"
          icon={<SwapVert />}
          isActive={menuAnchor !== null}
          onPress={openMenu}
        />
      </div>
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: { maxHeight: "calc(100dvh - 32px)", maxWidth: "90vw" },
          },
        }}
      >
        {patterns.map((pattern) => (
          <MenuItem
            key={pattern.id}
            dense
            selected={pattern.id === strummingPatternId}
            onClick={() => choose(pattern.id)}
            sx={{ gap: 2, justifyContent: "space-between" }}
          >
            <PatternPreview pattern={pattern} />
            <span className="text-xs opacity-60">{pattern.timeSignature}</span>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem dense onClick={openEditor}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit patterns" />
        </MenuItem>
      </Menu>
    </>
  );
};
