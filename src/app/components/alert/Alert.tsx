import { Slide } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideAlert, selectControlPanel } from "../../store/controlPanelSlice";

export const Alert: React.FC = () => {
  const dispatch = useDispatch();
  const { alertMessage, showAlert } = useSelector(selectControlPanel);
  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(hideAlert());
    }, 3000);

    return () => clearTimeout(timeout);
  }, [dispatch]);

  return (
    <Slide direction="down" in={showAlert} mountOnEnter unmountOnExit>
      <div
        onClick={() => dispatch(hideAlert())}
        className={`fixed cursor-pointer top-3 left-0 right-0 m-auto z-50 flex items-center justify-center w-56 p-4 bg-green-300 opacity-90`}
      >
        <span className="flex items-center text-base text-center text-gray-800">
          {alertMessage}
        </span>
      </div>
    </Slide>
  );
};
