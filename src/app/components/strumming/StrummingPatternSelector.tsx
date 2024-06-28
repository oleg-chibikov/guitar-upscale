import { SelectWrapper } from "@/app/components/settings/selectors/SelectWrapper";
import { chordStrummingPatterns } from "@/app/data/chordStrummingPatterns";
import { Pattern } from "@/app/data/strummingData";
import { formatStrums } from "@/app/helpers/strummingHelper";
import {
  selectSettings,
  setChordCustomStrummingPatternId,
} from "@/app/store/settingsSlice";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const StrummingPatternSelector: React.FC = () => {
  const {
    chordCustomStrummingPatternId,
    customStrummingPatternChangedTrigger,
  } = useSelector(selectSettings);
  const dispatch = useDispatch();
  const [patterns, setPatterns] = useState<Pattern[]>(chordStrummingPatterns);

  useEffect(() => {
    const savedPatterns = localStorage.getItem("strummingPatterns");
    if (savedPatterns) {
      const parsedPatterns: Pattern[] = JSON.parse(savedPatterns);
      setPatterns([...chordStrummingPatterns, ...parsedPatterns]);
    }
  }, [customStrummingPatternChangedTrigger]);

  return (
    <SelectWrapper
      value={chordCustomStrummingPatternId}
      onChange={(value) => {
        dispatch(setChordCustomStrummingPatternId(value as number));
      }}
      options={patterns.map((pattern) => ({
        value: pattern.id,
        label: formatStrums(pattern.strums),
      }))}
    />
  );
};

export { StrummingPatternSelector };
