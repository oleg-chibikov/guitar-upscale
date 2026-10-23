import Help from "@mui/icons-material/Help";
import { FC } from "react";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const AboutButton: FC = () => {
  return (
    <IconButtonWrapper
      icon={<Help />}
      tooltip={"About Guitar Upscale"}
      isActive={false}
      onPress={() => {
        window.open(
          "https://github.com/oleg-chibikov/guitar-upscale-assets/blob/main/documentation.md",
          "_blank",
        );
      }}
    />
  );
};
