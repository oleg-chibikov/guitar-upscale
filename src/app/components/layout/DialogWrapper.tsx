import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import { Dialog, Drawer, DrawerProps } from "@mui/material";
import { FC, useEffect, useState } from "react";

interface DialogWrapperProps extends WithChildren, WithClassName, WithId {
  isOpen: boolean;
  close: () => void;
  anchor?: DrawerProps["anchor"];
  headerText?: string;
  dialogClassName?: string;
  contentClassName?: string;
  darkBackdrop?: boolean;
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
  darkBackdrop,
}) => {
  const [open, setOpen] = useState<boolean>(false);

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
      onClose={close}
      headerText={headerText}
    >
      {children}
    </DialogContentWrapper>
  );

  if (anchor) {
    return (
      <Drawer
        className={dialogClassName}
        slotProps={backdrop}
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
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
    >
      {content}
    </Dialog>
  );
};
