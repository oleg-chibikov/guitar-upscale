import { useQuantize } from "@/app/components/quantize/QuantizeSelector";
import { TimeSignature } from "@/app/data/clockConstants";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setAutoQuantize, setQuantize } from "@/app/store/settingsSlice";
import AlignHorizontalLeft from "@mui/icons-material/AlignHorizontalLeft";
import { Badge, ListSubheader, Menu, MenuItem } from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

/**
 * Cubase's AQ: the recording and the looper put notes on the quantize grid as they come in
 */
export const AutoQuantizeButton: React.FC = () => {
  const autoQuantize = useSettingsSelector((s) => s.autoQuantize) ?? false;
  const quantize = useQuantize();
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButtonWrapper
        icon={
          <Badge
            badgeContent={quantize.split("/")[1]}
            color="primary"
            overlap="circular"
            sx={{
              "& .MuiBadge-badge": {
                height: 14,
                minWidth: 14,
                padding: "0 2px",
                fontSize: 10,
                fontWeight: "bold",
              },
            }}
          >
            <AlignHorizontalLeft />
          </Badge>
        }
        isActive={autoQuantize}
        toggle
        tooltip={
          autoQuantize
            ? `Auto quantize is on: recorded and looped notes snap to ${quantize}. Hold to choose the length`
            : `Auto quantize recorded and looped notes to ${quantize}. Hold to choose the length`
        }
        onPress={() => dispatch(setAutoQuantize(!autoQuantize))}
        onLongPress={setMenuAnchor}
      />
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <ListSubheader sx={{ lineHeight: "32px" }}>Quantize to</ListSubheader>
        {Object.values(TimeSignature).map((value) => (
          <MenuItem
            key={value}
            dense
            selected={value === quantize}
            onClick={() => {
              setMenuAnchor(null);
              dispatch(setQuantize(value));
              // picking a length means the person wants it used
              dispatch(setAutoQuantize(true));
            }}
          >
            {value}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
