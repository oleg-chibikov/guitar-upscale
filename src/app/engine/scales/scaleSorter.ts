import { scalesMap } from "@/app/data/scaleDefinitions";
import type { ScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";

export const sortScales = (scales: ScaleAndGroup[]): ScaleAndGroup[] =>
  scales.sort((a, b) => {
    const groupOrder = Array.from(scalesMap.keys());
    // Compare by the order set in the groups map
    const aGroupIndex = groupOrder.indexOf(a.group);
    const bGroupIndex = groupOrder.indexOf(b.group);
    if (aGroupIndex !== bGroupIndex) {
      return aGroupIndex - bGroupIndex;
    }

    const scale = scalesMap.get(a.group);
    if (scale !== undefined) {
      const scaleOrder = Array.from(scale.keys());

      // Compare by the order set in the groups map
      const aScaleIndex = scaleOrder.indexOf(a.scale);
      const bScaleIndex = scaleOrder.indexOf(b.scale);
      if (aScaleIndex !== bScaleIndex) {
        return aScaleIndex - bScaleIndex;
      }

      // within the same scale sort by note
      return a.note - b.note;
    }

    // If withing the same group, sort alphabetically
    return a.scale.localeCompare(b.scale);
  });
