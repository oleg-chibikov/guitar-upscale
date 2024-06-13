import { AlertType } from "@/app/data/alertType";
import { hideAlert, selectUi } from "@/app/store/uiSlice";
import { Slide } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export const Alert: React.FC = () => {
  const dispatch = useDispatch();
  const { alertMessage, showAlert, alertType, alertTimeout } =
    useSelector(selectUi);
  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(hideAlert());
    }, alertTimeout);

    return () => clearTimeout(timeout);
  }, [dispatch, showAlert, alertMessage]);

  return (
    <Slide direction="down" in={showAlert} mountOnEnter unmountOnExit>
      <div
        onClick={() => dispatch(hideAlert())}
        className={`fixed cursor-pointer top-3 left-0 right-0 m-auto flex items-center justify-center w-96 p-4 ${
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
        <span className="flex items-center text-base text-center text-gray-800 whitespace-pre-wrap">
          {alertMessage}
        </span>
      </div>
    </Slide>
  );
};
