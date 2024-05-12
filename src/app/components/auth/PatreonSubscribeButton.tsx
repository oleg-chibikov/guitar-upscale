import { FC } from "react";
import { ModalAuthButtonProps } from "./AuthButtonProps";
import { Button } from "@mui/material";


export const PatreonSubscribeButton: FC<ModalAuthButtonProps> = ({closeModal}) => {
  return (
    <Button
      size="small"
      variant="contained"
      color="secondary"
      onClick={() => {
        window.open(
          "https://patreon.com/guitar_upscale?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink",
          "_blank"
        );
        closeModal(); // Close modal after opening link
      }}
    >
      Change membership plan
    </Button>
  );
};
