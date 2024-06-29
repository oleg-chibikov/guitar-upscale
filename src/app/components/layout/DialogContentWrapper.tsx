import { CloseIcon } from "@/app/components/CloseIcon";
import { DialogHeader } from "@/app/components/layout/DialogHeader";
import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithStyle } from "@/app/helpers/withStyle";
import { selectUi } from "@/app/store/uiSlice";
import { DialogContent } from "@mui/material";
import { useSelector } from "react-redux";

interface DialogContentWrapperProps
  extends WithClassName,
    WithChildren,
    WithStyle {
  id?: string;
  onClose?: () => void;
  headerText?: string;
}

export const DialogContentWrapper: React.FC<DialogContentWrapperProps> = ({
  id,
  children,
  className,
  style,
  onClose,
  headerText,
}) => {
  const { theme } = useSelector(selectUi);
  const baseClasses = `flex flex-col max-h-full overflow-auto overscroll-contain border-2 gap-2`;
  const themeClasses =
    theme === Theme.Light
      ? "bg-accented_background-light border-border-light text-foreground-light"
      : "bg-accented_background-dark border-border-dark text-foreground-dark";

  return (
    <DialogContent
      id={id}
      className={`${baseClasses} ${themeClasses} ${className}`.trim()}
      style={style}
    >
      {headerText && <DialogHeader text={headerText} />}
      {onClose && <CloseIcon onPress={onClose} />}
      {children}
    </DialogContent>
  );
};
