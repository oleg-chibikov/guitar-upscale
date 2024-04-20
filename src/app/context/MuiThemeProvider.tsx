"use client";
import { ThemeProvider, createTheme } from "@mui/material";
import { FC, ReactNode } from "react";
import { useSelector } from "react-redux";
import { Theme, selectControlPanel } from "../store/controlPanelSlice";

export const MuiThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useSelector(selectControlPanel);

  const muiTheme = createTheme({
    palette: {
      mode: theme === Theme.Light ? "light" : "dark",
      primary: {
        main: theme === Theme.Light ? "#E6B39A" : "#537692", // matches tailwind button style
        contrastText: theme === Theme.Light ? "#2E1F1B" : "#001b2e",
      },
      secondary: {
        main: theme === Theme.Light ? "#F6E7D2" : "#b3cde4",
        contrastText: theme === Theme.Light ? "#2E1F1B" : "#001b2e",
      },
    },
  });
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
};
