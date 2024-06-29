import { SelectWrapper } from "@/app/components/uiFramework/SelectWrapper";
import {
  StrummingPattern,
  chordStrummingPatterns,
  formatStrums,
} from "@/app/data/strummingPatterns";
import { getAllPatterns } from "@/app/engine/strummingPatternsStorage";
import {
  selectSettings,
  setStrummingPatternId,
} from "@/app/store/settingsSlice";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const StrummingPatternSelector: React.FC = () => {
  const { strummingPatternId, strummingPatternChangedTrigger } =
    useSelector(selectSettings);
  const dispatch = useDispatch();
  const [patterns, setPatterns] = useState<StrummingPattern[]>(
    chordStrummingPatterns
  );

  useEffect(() => {
    const allPatterns = getAllPatterns();
    setPatterns(allPatterns);
  }, [strummingPatternChangedTrigger]);

  return (
    <SelectWrapper
      value={strummingPatternId}
      onChange={(value) => {
        dispatch(setStrummingPatternId(value as number));
      }}
      options={patterns.map((pattern) => ({
        value: pattern.id,
        label: formatStrums(pattern.strums),
      }))}
    />
  );
};

export { StrummingPatternSelector };
