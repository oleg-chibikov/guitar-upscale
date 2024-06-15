"use client";
import { Skin } from "@/app/data/skin";
import { selectUi, setSkin } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const SkinSelector: React.FC = () => {
  const { skin } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="body2">Skin:</Typography>
      <EnumSelector
        enumObj={Skin}
        selectedValue={skin}
        onValueChange={(value) => {
          dispatch(setSkin(value));
        }}
      />
    </>
  );
};
