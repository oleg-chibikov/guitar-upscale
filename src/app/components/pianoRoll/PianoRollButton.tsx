import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setPianoRollExpanded } from "@/app/store/uiSlice";
import PianoIcon from "@mui/icons-material/Piano"; // Or any other suitable icon
import React from "react";
import { useDispatch } from "react-redux";

interface PianoRollIconButtonProps {
  className?: string;
  id?: string;
}

export const PianoRollIconButton: React.FC<PianoRollIconButtonProps> = ({
  className,
  id,
}) => {
  const dispatch = useDispatch();
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);

  const handlePress = () => {
    dispatch(setPianoRollExpanded(!pianoRollExpanded));
  };

  return (
    <IconButtonWrapper
      onPress={handlePress}
      icon={<PianoIcon />}
      isActive={pianoRollExpanded}
      tooltip={pianoRollExpanded ? "Close Piano Roll" : "Open Piano Roll"}
      id={id}
      className={className}
    />
  );
};
