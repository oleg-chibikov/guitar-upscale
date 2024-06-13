import Cancel from "@mui/icons-material/Cancel";
import { FC } from "react";
import { IconButton } from "./settings/buttons/IconButton";

interface CloseIconProps {
  onPress: () => void;
}

export const CloseIcon: FC<CloseIconProps> = ({ onPress }) => {
  return (
    <IconButton
      inactiveBg="bg-transparent"
      className="right-2 top-2 absolute"
      icon={<Cancel />}
      tooltip="Close"
      onPress={onPress}
    />
  );
};
