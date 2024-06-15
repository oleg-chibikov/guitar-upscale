import React from "react";
import { useSelector } from "react-redux";

import { selectSettings } from "@/app/store/settingsSlice";
import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";

export const ScaleAndGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectSettings);
  const { theme } = useSelector(selectUi);

  return (
    <section
      className={`p-1 gap-1 grid ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
      style={{
        gridTemplateColumns: "auto 75px",
      }}
    >
      <Typography className="flex items-center" variant="body2">
        Style:
      </Typography>
      <ScaleGroupSelector />
      {scaleGroup && (
        <>
          <Typography className="flex items-center" variant="body2">
            Scale:
          </Typography>
          <ScaleSelector />
        </>
      )}
    </section>
  );
};
