import { SelectWrapper } from "@/app/components/uiFramework/SelectWrapper";
import { Pattern } from "@/app/data/strummingData";
import { chordStrummingPatterns } from "@/app/data/strummingPatterns";
import { getAllPatterns } from "@/app/engine/strummingPatternsStorage";
import { formatStrums } from "@/app/helpers/strummingHelper";
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
  const [patterns, setPatterns] = useState<Pattern[]>(chordStrummingPatterns);

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
