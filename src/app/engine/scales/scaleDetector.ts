import { AlertType } from "@/app/data/alertType";
import { DistinctNoteMarker } from "@/app/data/midiParser/distinctNoteMarker";
import { NOTE_COUNT } from "@/app/data/notes";
import { Scale } from "@/app/data/scales";
import { MissingChar } from "@/app/engine/detectorShared";
import { ScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { sortScales } from "@/app/engine/scales/scaleSorter";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { Trie } from "../../helpers/trie";

export const MIN_NOTES_TO_DETECT_SCALE = 5;

export type ScaleDetectorCallbackData =
  | {
      text: string;
      alertType?: AlertType;
      scales?: undefined;
    }
  | {
      scales: ScaleAndGroup[];
      text?: undefined;
      alertType?: undefined;
    };

class ScaleDetector {
  private trie: Trie;
  private reverseScalesMap: Map<string, ScaleAndGroup[]>;

  constructor() {
    this.trie = new Trie();
    this.reverseScalesMap = new Map<string, ScaleAndGroup[]>();
  }

  addScaleToDetectorLookup(scale: Scale, scaleData: ScaleAndGroup) {
    // if (fullKey.indexOf("omati") > -1) {
    //   debugger;
    // }
    const serializedScale = this.serializeScale(scale, "_");
    this.trie.add(serializedScale);
    addOrUpdateMapArray(this.reverseScalesMap, serializedScale, scaleData);
  }

  findMatches(
    notes: DistinctNoteMarker[],
    usedNotesCount: number,
    callback: (data: ScaleDetectorCallbackData) => void,
  ) {
    console.log("Detecting scale");

    if (usedNotesCount < MIN_NOTES_TO_DETECT_SCALE) {
      const remaining = MIN_NOTES_TO_DETECT_SCALE - usedNotesCount;
      callback({
        text:
          "Select " +
          (remaining === 1 ? "one more note" : `${remaining} more notes`) +
          " to detect the scale",
        alertType: AlertType.Neutral,
      });
      return;
    }
    const serializedScale = notes.map((x) => x ?? "?").join("");
    const matchedValues = this.trie.wildcardMatches(serializedScale);
    console.log("Matched values from trie", matchedValues);
    const nameData = Array.from(matchedValues)
      .flatMap((x) => this.reverseScalesMap.get(x))
      .filter((x) => x) as ScaleAndGroup[];
    if (!nameData.length) {
      console.warn("No scales matched to the values from trie");
      callback({
        text: "No scales matched",
        alertType: AlertType.Warning,
      });
      return;
    }
    const sortedData = sortScales(nameData);
    console.log("Matched scales", sortedData);
    callback({ scales: sortedData });
  }

  private serializeScale(scale: Scale, missingChar: MissingChar) {
    const serializedScale: (number | MissingChar)[] = [];

    // Initialize the serializedScale with the placeholder for each position
    for (let i = 0; i < NOTE_COUNT; i++) {
      serializedScale.push(missingChar);
    }

    // Populate serializedScale with the set note values
    scale.forEach((note) => {
      serializedScale[note] = 1;
    });

    return serializedScale.join("");
  }
}

export const scaleDetector = new ScaleDetector();
