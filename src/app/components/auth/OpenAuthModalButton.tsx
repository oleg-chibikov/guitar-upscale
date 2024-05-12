import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import Login from "@mui/icons-material/Login";
import { Button } from "@mui/material";
import { FC } from "react";
import { useSelector } from "react-redux";
import { AuthButtonProps } from "./AuthButtonProps";

export const OpenAuthModalButton: FC<AuthButtonProps> = ({ openModal }) => {
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  return (
    <Button
      size="small"
      onClick={openModal}
      variant="contained"
      color="primary"
      title="Sign in"
      style={{ minWidth: 0, padding: 6 }} // override MUI value
      className={`flex ${
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "flex-row-reverse"
          : "flex-row"
      } gap-2`}
    >
      <Login />
      <span
        className={`hidden sm:block ${
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }`}
      >
        Sign in
      </span>
    </Button>
  );
};
