import { Example } from "@/app/data/scaleExamples";
import { useEffect, useState } from "react";
import { usePremiumFeatures } from "../context/PremiumFeaturesProvider";

export const useExamples = () => {
  const premiumFeatures = usePremiumFeatures();
  const [examplesMap, setExamplesMap] =
    useState<Map<string, Map<string, Example[]>>>();

  useEffect(() => {
    const updateExampleFeature = async () => {
      if (premiumFeatures.melodies) {
        const { examplesMap } = await import("@/app/data/scaleExamples");
        setExamplesMap(examplesMap);
      }
    };

    updateExampleFeature();
  }, [premiumFeatures]);

  return examplesMap;
};
