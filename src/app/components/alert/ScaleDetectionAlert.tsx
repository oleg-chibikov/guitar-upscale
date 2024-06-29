import {
  hideScalesAlert,
  selectUi,
  setAndShowAlert,
} from "@/app/store/uiSlice";
import { Button, Drawer, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { AlertType } from "@/app/data/alertType";
import {
  ScaleAndGroup,
  formatScale,
  setCurrentScaleAndGroup,
} from "@/app/engine/scales/scaleLookupBuilder";
import { setPreventScaleDetectorFlush } from "@/app/store/settingsSlice";
import { FC, useEffect, useState } from "react";

export const ScaleDetectionAlert: FC = () => {
  const dispatch = useDispatch();
  const { suggestedScales, showScalesAlert, theme } = useSelector(selectUi);

  const [open, setOpen] = useState<boolean>(false); // this is needed to use animation when loaded first time

  useEffect(() => {
    setOpen(showScalesAlert);
  }, [showScalesAlert]);

  const handleCloseModal = () => {
    dispatch(hideScalesAlert());
  };

  const handleButtonClick = (data: ScaleAndGroup) => {
    setPreventScaleDetectorFlush(true);
    try {
      setCurrentScaleAndGroup(data, dispatch);
      dispatch(
        setAndShowAlert({
          message: "Switched to " + formatScale(data),
          alertType: AlertType.Success,
        })
      );
    } finally {
      setPreventScaleDetectorFlush(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="suggested-scales-modal"
      anchor="top"
    >
      <DialogContentWrapper
        headerText="Matching scales"
        className={"text-center items-center justify-center w-96"}
        onClose={handleCloseModal}
      >
        <div className="max-h-96 mt-2 overflow-auto flex flex-col gap-2">
          {suggestedScales?.map((scaleAndGroup) => (
            <Button
              className="w-full"
              variant="contained"
              color="primary"
              onClick={() => handleButtonClick(scaleAndGroup)}
            >
              <Typography noWrap>{formatScale(scaleAndGroup)}</Typography>
            </Button>
          ))}
        </div>
      </DialogContentWrapper>
    </Drawer>
  );
};
