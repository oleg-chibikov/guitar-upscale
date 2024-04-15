import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ScaleObject, scalesMap } from "../../../data/scales";
import {
  selectControlPanel,
  setScale,
  setScaleGroup,
} from "../../../store/controlPanelSlice";

export const ScaleSelector: React.FC = () => {
  const { scale, scaleGroup, bg, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const scales = scalesMap;

  const handleScaleGroupChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    dispatch(setScaleGroup(event.target.value));
  };

  const handleScaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setScale(event.target.value));
  };

  return (
    <div
      className={`bg-${bg} opacity-95 p-1 gap-2 grid`}
      style={{
        gridTemplateColumns: "auto minmax(100px, auto)",
      }}
    >
      {/* TODO Add text component */}
      <span className={textStyle}>Style:</span>
      <select
        className="text-md"
        value={scaleGroup}
        onChange={handleScaleGroupChange}
      >
        {Array.from(scales.entries()).map(([groupName]) => (
          <option key={groupName} value={groupName}>
            {groupName}
          </option>
        ))}
      </select>
      {scaleGroup && (
        <>
          <span className={textStyle}>Scale:</span>
          <select
            className="text-md"
            value={scale}
            onChange={handleScaleChange}
          >
            {Array.from(scales.get(scaleGroup)!.entries()).map(
              ([scaleName, scaleObject]) => {
                const hasExamples =
                  (scaleObject as ScaleObject)?.examples?.length > 0;
                return (
                  <option key={scaleName} value={scaleName}>
                    {scaleName}
                    {hasExamples && " *"}
                  </option>
                );
              }
            )}
          </select>
        </>
      )}
    </div>
  );
};
