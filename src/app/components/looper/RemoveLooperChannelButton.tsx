import { IconButton } from "@/app/components/settings/buttons/IconButton";
import {
  CanSetLooperState,
  looperState,
  removeChannel,
} from "@/app/engine/looper";
import Remove from "@mui/icons-material/Remove";

export const RemoveLooperChannelButton: React.FC<CanSetLooperState> = ({
  setState,
  disabled,
}) => {
  return (
    <IconButton
      disabled={disabled}
      className="scale-75 origin-center"
      icon={<Remove fontSize="small" />}
      tooltip={"Remove looper channel"}
      isActive={true}
      onPress={() => {
        removeChannel();
        setState({ ...looperState });
      }}
    />
  );
};
