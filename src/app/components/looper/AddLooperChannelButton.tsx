import { IconButtonWrapper } from "@/app/components/settings/buttons/IconButton";
import {
  CanSetLooperState,
  addChannel,
  looperState,
} from "@/app/engine/looper/looper";
import Add from "@mui/icons-material/Add";

export const AddLooperChannelButton: React.FC<CanSetLooperState> = ({
  setState,
  disabled,
}) => {
  return (
    <IconButtonWrapper
      disabled={disabled}
      icon={<Add />}
      tooltip={"Add looper channel"}
      isActive={true}
      onPress={() => {
        addChannel();
        setState({ ...looperState });
      }}
    />
  );
};
