import { selectUi, setShowAspectRatio } from "@/app/store/uiSlice";
import { Modal } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { AspectRatioControl } from "@/app/components/aspectRatio/AspectRatioControl";
import { FC } from "react";

export const AspectRatioModal: FC = () => {
  const dispatch = useDispatch();
  const { showAspectRatio } = useSelector(selectUi);

  const handleCloseDialog = () => {
    dispatch(setShowAspectRatio(false));
  };

  return (
    <Modal
      slotProps={{
        backdrop: { style: { backgroundColor: "rgba(0,0,0,0.8)" } },
      }}
      open={showAspectRatio}
      onClose={handleCloseDialog}
      className="relative"
      aria-labelledby="aspect-ratio-modal"
    >
      <AspectRatioControl />
    </Modal>
  );
};
