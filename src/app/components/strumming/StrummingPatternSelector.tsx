import { SelectWrapper } from "@/app/components/uiFramework/SelectWrapper";
import {
  StrummingPattern,
  chordStrummingPatterns,
  formatStrums,
} from "@/app/data/strummingPatterns";
import { getAllPatterns } from "@/app/engine/strummingPatternsStorage";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setStrummingPatternId } from "@/app/store/settingsSlice";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const StrummingPatternSelector: React.FC = () => {
  const strummingPatternId = useSettingsSelector((s) => s.strummingPatternId);
  const strummingPatternChangedTrigger = useSettingsSelector(
    (s) => s.strummingPatternChangedTrigger,
  );

  const dispatch = useDispatch();
  const [patterns, setPatterns] = useState<StrummingPattern[]>(
    chordStrummingPatterns,
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
