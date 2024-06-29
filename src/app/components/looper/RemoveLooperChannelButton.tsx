import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import {
  CanSetLooperState,
  looperState,
  removeChannel,
} from "@/app/engine/looper/looper";
import Remove from "@mui/icons-material/Remove";

export const RemoveLooperChannelButton: React.FC<CanSetLooperState> = ({
  setState,
  disabled,
}) => {
  return (
    <IconButtonWrapper
      disabled={disabled}
      icon={<Remove />}
      tooltip={"Remove looper channel"}
      isActive={true}
      onPress={() => {
        removeChannel();
        setState({ ...looperState });
      }}
    />
  );
};
