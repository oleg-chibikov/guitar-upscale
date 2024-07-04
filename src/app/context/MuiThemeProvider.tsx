"use client";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { ThemeProvider, createTheme } from "@mui/material";
import { FC } from "react";
import { WithChildren } from "../helpers/withChildren";

export const MuiThemeProvider: FC<WithChildren> = ({ children }) => {
  const theme = useUiSelector((s) => s.theme);

  const muiTheme = createTheme({
    components: {
      MuiIconButton: {
        styleOverrides: {
          root: {
            backgroundColor: theme === Theme.Light ? "#e5cdbf" : "#333333",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { minWidth: 0 },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: "rgba(108, 122, 137, 0.5)",
            right: 0,
          },
          select: {
            color: "black", // Set font color to black
            padding: "6px",
            lineHeight: "1.25",
            minHeight: "initial", // Ensure minimal height for the input,
          },
        },
      },
    },

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
        contrastText: theme === Theme.Light ? "#2E1F1B" : "#F2F2F2",
      },
    },

    typography: {
      h1: {
        fontSize: "1.5rem",
      },
      h2: {
        fontSize: "1.25rem",
      },
      h3: {
        fontSize: "1.125rem",
      },
      h4: {
        fontSize: "1rem",
      },
      h5: {
        fontSize: "0.875rem",
      },
      h6: {
        fontSize: "0.75rem",
      },
      subtitle1: {
        fontSize: "0.7rem",
      },
      subtitle2: {
        fontSize: "0.65rem",
      },
      body1: {
        fontSize: "0.85rem",
      },
      body2: {
        fontSize: "0.75rem",
      },
      button: {
        fontSize: "0.75rem",
      },
      caption: {
        fontSize: "0.65rem",
      },
      overline: {
        fontSize: "0.65rem",
      },
    },
  });

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
};
