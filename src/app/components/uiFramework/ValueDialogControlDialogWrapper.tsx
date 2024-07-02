import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { ValueDialogControlDialogProps } from "@/app/components/uiFramework/ValueDialogControl";
import { ValueDialogControlDialog } from "@/app/components/uiFramework/ValueDialogControlDialog";
import { FC } from "react";

// We don't want to load this async. It's crucial to have this loaded, otherwise the UX is poor
// const ValueDialogControlDialog = dynamic(
//   async () =>
//     (await import("./ValueDialogControlDialog")).ValueDialogControlDialog
// );

export const ValueDialogControlDialogWrapper: FC<
  ValueDialogControlDialogProps
> = (props) => (
  <LazyLoadWrapper
    renderComponent={() => <ValueDialogControlDialog {...props} />}
    isOpen={props.isOpen}
  />
);
