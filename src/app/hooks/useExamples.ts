import { useEffect, useState } from "react";
import { usePremiumFeatures } from "../context/PremiumFeaturesProvider";
import { ExamplesMap } from "../data/example";

export const useExamples = () => {
  const { premiumFeatures } = usePremiumFeatures();
  const [examplesMap, setExamplesMap] = useState<ExamplesMap>();

  useEffect(() => {
    if (premiumFeatures.melodies !== true) {
      return;
    }
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      const { getExamples, subscribeToLibrary, toExamplesMap } = await import(
        "@/app/engine/songs/songLibrary"
      );
      const refresh = async () => {
        const examples = await getExamples();
        if (active) {
          setExamplesMap(toExamplesMap(examples));
        }
      };
      if (!active) {
        return;
      }
      unsubscribe = subscribeToLibrary(() => void refresh());
      await refresh();
    };

    void subscribe();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [premiumFeatures]);

  return examplesMap;
};
