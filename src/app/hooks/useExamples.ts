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
    // a slow older read must not overwrite a newer one
    let latestRefresh = 0;
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      const { getExamples, subscribeToLibrary, toExamplesMap } =
        await import("@/app/engine/songs/songLibrary");
      const refresh = async () => {
        const refreshId = ++latestRefresh;
        const examples = await getExamples();
        if (active && refreshId === latestRefresh) {
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
