import {
  hideScalesAlert,
  selectUi,
  setAndShowAlert,
} from "@/app/store/uiSlice";
import { Button, Modal, Slide, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { CloseIcon } from "@/app/components/CloseIcon";
import { AlertType } from "@/app/data/alertType";
import { Theme } from "@/app/data/theme";
import {
  ScaleAndGroup,
  formatScale,
  setCurrentScaleAndGroup,
} from "@/app/engine/scales/scaleLookupBuilder";
import { setPreventScaleDetectorFlush } from "@/app/store/settingsSlice";
import { FC } from "react";

export const ScaleDetectionAlert: FC = () => {
  const dispatch = useDispatch();
  const { suggestedScales, showScalesAlert, theme } = useSelector(selectUi);

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
    <Modal
      open={showScalesAlert}
      onClose={handleCloseModal}
      aria-labelledby="suggested-scales-modal"
    >
      <Slide direction="down" in={showScalesAlert} mountOnEnter unmountOnExit>
        <div
          className={`fixed text-center cursor-pointer border-2 top-3 left-0 right-0 m-auto items-center justify-center w-96 p-2 ${
            theme === Theme.Light
              ? "bg-accented_background-light"
              : "bg-accented_background-dark"
          }`}
          style={{ zIndex: 9998 }}
        >
          <Typography
            variant="caption"
            noWrap
            className={
              theme === Theme.Light
                ? "text-foreground-light"
                : "text-foreground-dark"
            }
          >
            Matching scales
          </Typography>
          <CloseIcon onPress={handleCloseModal} />
          <div className="max-h-96 mt-2 overflow-auto flex flex-col gap-2">
            {suggestedScales?.map((scaleAndGroup) => (
              <Button
                className="w-full"
                variant="contained"
                color="primary"
                onClick={() => handleButtonClick(scaleAndGroup)}
              >
                <Typography variant="body2" noWrap>
                  {formatScale(scaleAndGroup)}
                </Typography>
              </Button>
            ))}
          </div>
        </div>
      </Slide>
    </Modal>
  );
};
