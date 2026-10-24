import { CloseIcon } from "@/app/components/uiFramework/CloseIcon";
import { DialogHeader } from "@/app/components/uiFramework/DialogHeader";
import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { DialogContent } from "@mui/material";

interface DialogContentWrapperProps
  extends WithClassName, WithChildren, WithStyle {
  id?: string;
  // the dialog points aria-labelledby at the header with this id
  titleId?: string;
  onClose?: () => void;
  headerText?: string;
  contentClassName?: string;
  hasPadding: boolean;
}

export const DialogContentWrapper: React.FC<DialogContentWrapperProps> = ({
  id,
  titleId,
  children,
  className,
  style,
  onClose,
  headerText,
  contentClassName,
  hasPadding,
}) => {
  const theme = useUiSelector((s) => s.theme);

  return (
    <section
      id={id}
      style={style}
      className={`${className !== undefined ? `${className} ` : ""} ${
        theme === Theme.Light
          ? "border-border-light bg-accented_background-light text-foreground-light"
          : "border-border-dark bg-accented_background-dark text-foreground-dark"
      } flex flex-col gap-2 border-2`}
    >
      {headerText !== undefined && (
        <DialogHeader id={titleId} text={headerText} onClose={onClose} />
      )}
      {headerText === undefined && onClose && (
        <CloseIcon onPress={onClose} className="absolute top-6 right-6 z-10" />
      )}
      <DialogContent
        sx={hasPadding ? undefined : { padding: 0 }}
        className={`${contentClassName} flex flex-col gap-2`}
      >
        {children}
      </DialogContent>
    </section>
  );
};
