import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { WithClassName } from "@/app/helpers/withClassName";
import Cancel from "@mui/icons-material/Cancel";
import { FC } from "react";

interface CloseIconProps extends WithClassName {
  onPress: () => void;
}

export const CloseIcon: FC<CloseIconProps> = ({ onPress, className }) => {
  return (
    <IconButtonWrapper
      className={className}
      icon={<Cancel />}
      tooltip="Close"
      onPress={onPress}
    />
  );
};
