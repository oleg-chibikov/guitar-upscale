import Refresh from "@mui/icons-material/Refresh";
import { FC } from "react";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const ReloadButton: FC = () => {
  return (
    <IconButtonWrapper
      icon={<Refresh />}
      tooltip={"Reload page"}
      isActive={false}
      onPress={() => {
        window.location.reload();
      }}
    />
  );
};
