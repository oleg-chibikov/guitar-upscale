import {
  hideScalesAlert,
  selectUi,
  setAndShowAlert,
} from "@/app/store/uiSlice";
import { Button, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { DialogWrapper } from "@/app/components/layout/DialogWrapper";
import { AlertType } from "@/app/data/alertType";
import { SCALE_DETECTION_DIALOG } from "@/app/data/elementIds";
import {
  ScaleAndGroup,
  formatScale,
  setCurrentScaleAndGroup,
} from "@/app/engine/scales/scaleLookupBuilder";
import { setPreventScaleDetectorFlush } from "@/app/store/settingsSlice";
import { FC } from "react";

export const ScaleDetectionAlert: FC = () => {
  const dispatch = useDispatch();
  const { suggestedScales, showScalesAlert } = useSelector(selectUi);

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
    <DialogWrapper
      headerText="Matching scales"
      isOpen={showScalesAlert}
      close={() => dispatch(hideScalesAlert())}
      id={SCALE_DETECTION_DIALOG}
      contentClassName="overflow-y-auto max-h-48"
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
    </DialogWrapper>
  );
};
