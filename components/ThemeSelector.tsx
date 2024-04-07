import React from "react";
import { useDispatch } from "react-redux";
import { Theme, setTheme } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import EnumSelector from "./EnumSelector";

const ThemeSelector: React.FC = () => {
  const { theme } = useAppSelector((state) => state.controlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Theme}
      selectedValue={theme}
      onValueChange={(value) => {
        dispatch(setTheme(value));
      }}
    />
  );
};

export default ThemeSelector;
