import {
  hideScalesAlert,
  selectUi,
  setAndShowAlert,
} from "@/app/store/uiSlice";
import { Button, Dialog, Typography } from "@mui/material";
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
    <Dialog
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="suggested-scales-modal"
    >
      <DialogContentWrapper
        headerText="Matching scales"
        onClose={handleCloseModal}
        className="overflow-y-auto max-h-48"
      >
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
      </DialogContentWrapper>
    </Dialog>
  );
};
