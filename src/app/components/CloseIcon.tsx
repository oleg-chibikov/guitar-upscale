import Cancel from "@mui/icons-material/Cancel";
import { FC } from "react";
import { IconButtonWrapper } from "./settings/buttons/IconButton";

interface CloseIconProps {
  onPress: () => void;
}

export const CloseIcon: FC<CloseIconProps> = ({ onPress }) => {
  return (
    <IconButtonWrapper
      className="right-4 top-4 absolute z-20"
      icon={<Cancel />}
      tooltip="Close"
      onPress={onPress}
    />
  );
};
