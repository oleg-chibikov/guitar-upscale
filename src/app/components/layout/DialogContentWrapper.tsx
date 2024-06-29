import { CloseIcon } from "@/app/components/layout/CloseIcon";
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

  return (
    <section
      style={style}
      className={`${
        theme === Theme.Light
          ? "bg-accented_background-light border-border-light text-foreground-light"
          : "bg-accented_background-dark border-border-dark text-foreground-dark"
      } border-2`}
    >
      {headerText && <DialogHeader text={headerText} onClose={onClose} />}
      {!headerText && onClose && (
        <CloseIcon onPress={onClose} className="absolute top-5 right-5 z-10" />
      )}
      <DialogContent id={id} className={`${className} flex flex-col gap-2`}>
        {children}
      </DialogContent>
    </section>
  );
};
