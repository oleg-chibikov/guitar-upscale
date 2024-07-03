import { CloseIcon } from "@/app/components/uiFramework/CloseIcon";
import { DialogHeader } from "@/app/components/uiFramework/DialogHeader";
import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { DialogContent } from "@mui/material";

interface DialogContentWrapperProps
  extends WithClassName,
    WithChildren,
    WithStyle {
  id?: string;
  onClose?: () => void;
  headerText?: string;
  contentClassName?: string;
}

export const DialogContentWrapper: React.FC<DialogContentWrapperProps> = ({
  id,
  children,
  className,
  style,
  onClose,
  headerText,
  contentClassName,
}) => {
  const theme = useUiSelector((s) => s.theme);

  return (
    <section
      id={id}
      aria-labelledby={id}
      style={style}
      className={`${className} ${
        theme === Theme.Light
          ? "bg-accented_background-light border-border-light text-foreground-light"
          : "bg-accented_background-dark border-border-dark text-foreground-dark"
      } border-2 flex flex-col gap-2`}
    >
      {headerText !== undefined && (
        <DialogHeader text={headerText} onClose={onClose} />
      )}
      {headerText === undefined && onClose && (
        <CloseIcon onPress={onClose} className="absolute top-6 right-6 z-10" />
      )}
      <DialogContent className={`${contentClassName} flex flex-col gap-2`}>
        {children}
      </DialogContent>
    </section>
  );
};
