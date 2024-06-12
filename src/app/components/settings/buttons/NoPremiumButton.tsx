import { AlertType } from "@/app/data/alertType";
import { setAndShowAlert } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButton, IconButtonProps } from "./IconButton";

interface NoPremiumButtonProps
  extends Omit<IconButtonProps, "icon" | "tooltip" | "onPress"> {
  planName: string;
  functionalityDescription: string;
  icon: React.ReactElement;
}

export const NoPremiumButton: React.FC<NoPremiumButtonProps> = ({
  planName,
  functionalityDescription,
  icon,
  ...props
}) => {
  const dispatch = useDispatch();
  const warningMessage = `Please subscribe to ${planName} plan in order to ${functionalityDescription}`;

  return (
    <IconButton
      {...props}
      icon={icon}
      disabled
      allowHandlerInDisabledState
      tooltip={warningMessage}
      onPress={() =>
        dispatch(
          setAndShowAlert({
            message: warningMessage,
            alertType: AlertType.Warning,
          })
        )
      }
    />
  );
};
