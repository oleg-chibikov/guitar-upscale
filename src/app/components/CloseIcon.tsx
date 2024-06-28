import Cancel from "@mui/icons-material/Cancel";
import { FC } from "react";
import { IconButtonWrapper } from "./settings/buttons/IconButton";

interface CloseIconProps {
  onPress: () => void;
}

export const CloseIcon: FC<CloseIconProps> = ({ onPress }) => {
  return (
    <IconButtonWrapper
      inactiveBg="bg-transparent"
      className="right-2 top-2 absolute z-20"
      icon={<Cancel />}
      tooltip="Close"
      onPress={onPress}
    />
  );
};
