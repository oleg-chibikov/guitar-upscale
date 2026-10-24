import { AlertType } from "@/app/data/alertType";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { hideAlert } from "@/app/store/uiSlice";
import { Slide, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

export const Alert: React.FC = () => {
  const dispatch = useDispatch();

  const alertMessage = useUiSelector((s) => s.alertMessage);
  const showAlert = useUiSelector((s) => s.showAlert);
  const alertType = useUiSelector((s) => s.alertType);
  const alertTimeout = useUiSelector((s) => s.alertTimeout);
  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(hideAlert());
    }, alertTimeout);

    return () => clearTimeout(timeout);
  }, [dispatch, showAlert, alertMessage, alertTimeout]);

  return (
    <Slide direction="down" in={showAlert} mountOnEnter unmountOnExit>
      <div
        role={alertType === AlertType.Error ? "alert" : "status"}
        onClick={() => dispatch(hideAlert())}
        className={`fixed top-3 right-0 left-0 m-auto flex w-[min(24rem,calc(100vw-16px))] cursor-pointer items-center justify-center p-4 ${
          alertType === AlertType.Error
            ? "bg-red-500"
            : alertType === AlertType.Warning
              ? "bg-yellow-500"
              : alertType === AlertType.Success
                ? "bg-green-500"
                : "bg-slate-200"
        } opacity-90`}
        style={{ zIndex: 9999 }}
      >
        <Typography
          className={`flex items-center text-center text-base whitespace-pre-wrap ${
            alertType === AlertType.Error ? "text-gray-900" : "text-gray-800"
          }`}
        >
          {alertMessage}
        </Typography>
      </div>
    </Slide>
  );
};
