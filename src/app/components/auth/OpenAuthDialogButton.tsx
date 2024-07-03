import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import Login from "@mui/icons-material/Login";
import { Button, Typography } from "@mui/material";
import { FC } from "react";
import { AuthButtonProps } from "./AuthButtonProps";

export const OpenAuthDialogButton: FC<AuthButtonProps> = ({ openDialog }) => {
  const theme = useUiSelector((s) => s.theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const text = hasDigitalGoodsService ? "Subscribe" : "Sign in";
  return (
    <Button
      size="small"
      onClick={openDialog}
      variant="contained"
      color="primary"
      title={text}
      style={{ minWidth: 0, padding: 6 }} // override MUI value
      className={`flex ${
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "flex-row-reverse"
          : "flex-row"
      } gap-2`}
    >
      <Login />
      <Typography
        className={`hidden sm:block ${
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }`}
      >
        {text}
      </Typography>
    </Button>
  );
};
