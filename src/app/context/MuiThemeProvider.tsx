"use client";
import { Theme } from "@/app/data/theme";
import { ThemeProvider, createTheme } from "@mui/material";
import { FC } from "react";
import { useSelector } from "react-redux";
import { WithChildren } from "../helpers/withChildren";
import { selectUi } from "../store/uiSlice";

export const MuiThemeProvider: FC<WithChildren> = ({ children }) => {
  const { theme } = useSelector(selectUi);

  const muiTheme = createTheme({
    shape: {
      borderRadius: 0,
    },
    palette: {
      mode: theme === Theme.Light ? "light" : "dark",
      primary: {
        main: theme === Theme.Light ? "#E6B39A" : "#537692", // matches tailwind button style
        contrastText: theme === Theme.Light ? "#2E1F1B" : "#001b2e",
      },
      secondary: {
        main: theme === Theme.Light ? "#F6E7D2" : "#1d3f58",
        contrastText: theme === Theme.Light ? "#2E1F1B" : "#001b2e",
      },
    },
  });

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
};
