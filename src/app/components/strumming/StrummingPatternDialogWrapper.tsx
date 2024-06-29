import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import {
  selectUi,
  setStrummingPatternEditorExpanded,
} from "@/app/store/uiSlice";
import { Button } from "@mui/material";
import dynamic from "next/dynamic";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const StrummingPatternDialog = dynamic(
  async () => (await import("./StrummingPatternDialog")).StrummingPatternDialog
);

export const StrummingPatternDialogWrapper: React.FC = () => {
  const dispatch = useDispatch();
  const { strummingPatternEditorExpanded } = useSelector(selectUi);
  return (
    <>
      <Button
        variant="contained"
        onClick={() => dispatch(setStrummingPatternEditorExpanded(true))}
      >
        Open Strumming Pattern Editor
      </Button>

      <LazyLoadWrapper
        renderComponent={() => <StrummingPatternDialog />}
        isOpen={strummingPatternEditorExpanded}
      />
    </>
  );
};
