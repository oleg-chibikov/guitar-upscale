import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

const Alert = dynamic(async () => (await import("./Alert")).Alert);

export const AlertWrapper: FC = () => {
  const { showAlert } = useSelector(selectUi);
  return (
    <LazyLoadWrapper renderComponent={() => <Alert />} isOpen={showAlert} />
  );
};
