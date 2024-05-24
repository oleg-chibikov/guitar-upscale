import { IconButton } from "@/app/components/settings/buttons/IconButton";
import {
  CanSetLooperState,
  addChannel,
  looperState,
} from "@/app/engine/looper";
import Add from "@mui/icons-material/Add";

export const AddLooperChannelButton: React.FC<CanSetLooperState> = ({
  setState,
  disabled,
}) => {
  return (
    <IconButton
      disabled={disabled}
      className="scale-75 origin-center"
      icon={<Add fontSize="small" />}
      tooltip={"Add looper channel"}
      isActive={true}
      onPress={() => {
        addChannel();
        setState({ ...looperState });
      }}
    />
  );
};
