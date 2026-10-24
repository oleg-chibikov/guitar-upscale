import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import React from "react";

const StrummingPatternDialog = dynamic(
  async () => (await import("./StrummingPatternDialog")).StrummingPatternDialog,
);

export const StrummingPatternDialogWrapper: React.FC = () => {
  const strummingPatternEditorExpanded = useUiSelector(
    (s) => s.strummingPatternEditorExpanded,
  );
  return (
    <LazyLoadWrapper
      renderComponent={() => <StrummingPatternDialog />}
      isOpen={strummingPatternEditorExpanded}
    />
  );
};
