import { Button } from "@mui/material";
import { FC } from "react";
import { DialogAuthButtonProps } from "./AuthButtonProps";

export const PatreonSubscribeButton: FC<DialogAuthButtonProps> = ({
  closeDialog,
}) => {
  return (
    <Button
      size="small"
      variant="contained"
      color="secondary"
      onClick={() => {
        window.open(
          "https://patreon.com/guitar_upscale?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink",
          "_blank",
        );
        closeDialog(); // Close dialog after opening link
      }}
    >
      Change membership plan
    </Button>
  );
};
