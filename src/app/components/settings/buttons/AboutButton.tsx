import Help from "@mui/icons-material/Help";
import { FC } from "react";
import { IconButton } from "./IconButton";

export const AboutButton: FC = () => {
  return (
    <IconButton
      icon={<Help />}
      tooltip={"About Guitar Upscale"}
      isActive={false}
      onPress={() => {
        window.open(
          "https://github.com/oleg-chibikov/guitar-upscale-assets/blob/main/documentation.md",
          "_blank"
        );
      }}
    />
  );
};
