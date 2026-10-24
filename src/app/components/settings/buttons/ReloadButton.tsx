import { ConfirmationDialog } from "@/app/components/uiFramework/ConfirmationDialog";
import {
  hasUnsavedWork,
  reloadWithoutWarning,
} from "@/app/helpers/unsavedWork";
import Refresh from "@mui/icons-material/Refresh";
import { FC, useState } from "react";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const ReloadButton: FC = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <IconButtonWrapper
        icon={<Refresh />}
        tooltip={"Reload page"}
        isActive={false}
        onPress={() => {
          if (hasUnsavedWork()) {
            setConfirmOpen(true);
          } else {
            reloadWithoutWarning();
          }
        }}
      />
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={reloadWithoutWarning}
        title="Reload the page?"
        content="The recording in progress and loops you haven't saved will be lost."
        confirmButtonText="Reload"
      />
    </>
  );
};
