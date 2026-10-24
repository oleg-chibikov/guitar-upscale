import { DialogContentWrapper } from "@/app/components/uiFramework/DialogContentWrapper";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import { Dialog, Drawer, DrawerProps } from "@mui/material";
import { FC, useEffect, useId, useState } from "react";

interface DialogWrapperProps extends WithChildren, WithClassName, WithId {
  isOpen: boolean;
  close: () => void;
  anchor?: DrawerProps["anchor"];
  headerText?: string;
  dialogClassName?: string;
  contentClassName?: string;
  darkBackdrop?: boolean;
  noPadding?: boolean;
}

export const DialogWrapper: FC<DialogWrapperProps> = ({
  isOpen,
  close,
  anchor,
  children,
  id,
  headerText,
  className,
  dialogClassName,
  contentClassName,
  darkBackdrop = false,
  noPadding = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const titleId = useId();
  const labelledBy = headerText !== undefined ? titleId : undefined;

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const backdrop = darkBackdrop
    ? {
        backdrop: { style: { backgroundColor: "rgba(0,0,0,0.9)" } },
      }
    : undefined;

  const content = (
    <DialogContentWrapper
      className={className}
      contentClassName={contentClassName}
      id={id}
      titleId={titleId}
      onClose={close}
      headerText={headerText}
      hasPadding={!noPadding}
    >
      {children}
    </DialogContentWrapper>
  );

  if (anchor) {
    return (
      <Drawer
        className={dialogClassName}
        slotProps={{
          ...backdrop,
          paper: { role: "dialog", "aria-labelledby": labelledBy },
        }}
        anchor={anchor}
        open={open}
        onClose={close}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog
      className={className}
      slotProps={backdrop}
      aria-labelledby={labelledBy}
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
    >
      {content}
    </Dialog>
  );
};
