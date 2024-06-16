import { LazyLoadWrapper } from "@/app/components/layout/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";

const Alert = dynamic(async () => (await import("./Alert")).Alert);

export const AlertWrapper: FC = () => (
  <LazyLoadWrapper
    renderComponent={() => <Alert />}
    selector={(state) => selectUi(state).showAlert}
  />
);
