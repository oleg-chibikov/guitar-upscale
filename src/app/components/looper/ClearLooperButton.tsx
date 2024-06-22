import { IconButton } from "@/app/components/settings/buttons/IconButton";
import {
  CanSetLooperState,
  clearLooperState,
  looperState,
} from "@/app/engine/looper/looper";
import Clear from "@mui/icons-material/Clear";

export const ClearLooperButton: React.FC<CanSetLooperState> = ({
  setState,
  disabled,
}) => {
  return (
    <IconButton
      disabled={disabled}
      icon={<Clear />}
      activeBg="bg-red-500"
      tooltip={"Clear looper"}
      isActive={true}
      onPress={() => {
        clearLooperState();
        setState({ ...looperState });
      }}
    />
  );
};
