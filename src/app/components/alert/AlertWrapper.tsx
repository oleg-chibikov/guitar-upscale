import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import { FC } from "react";

const Alert = dynamic(async () => (await import("./Alert")).Alert);

export const AlertWrapper: FC = () => {
  const showAlert = useUiSelector((s) => s.showAlert);
  return (
    <LazyLoadWrapper renderComponent={() => <Alert />} isOpen={showAlert} />
  );
};
