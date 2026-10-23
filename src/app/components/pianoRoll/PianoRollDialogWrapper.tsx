import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import { FC } from "react";

const PianoRollDialog = dynamic(
  async () => (await import("./PianoRollDialog")).PianoRollDialog,
);

export const PianoRollDialogWrapper: FC = () => {
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  return (
    <LazyLoadWrapper
      renderComponent={() => <PianoRollDialog />}
      isOpen={pianoRollExpanded}
    />
  );
};
