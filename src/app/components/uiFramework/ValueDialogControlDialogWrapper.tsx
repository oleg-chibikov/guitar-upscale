import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { ValueDialogControlDialogProps } from "@/app/components/uiFramework/ValueDialogControl";
import dynamic from "next/dynamic";
import { FC } from "react";

const ValueDialogControlDialog = dynamic(
  async () =>
    (await import("./ValueDialogControlDialog")).ValueDialogControlDialog
);

export const ValueDialogControlDialogWrapper: FC<
  ValueDialogControlDialogProps
> = (props) => (
  <LazyLoadWrapper
    renderComponent={() => <ValueDialogControlDialog {...props} />}
    isOpen={props.isOpen}
  />
);
