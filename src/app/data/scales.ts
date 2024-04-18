import { tunings } from "./notes";

export type Example = {
  band: string;
  title: string;
  melody: string;
  tuning?: string;
};
export type Scale = number[] | ScaleObject;
export type ScaleObject = { scale: number[]; examples: Example[] };

// Debug - check duplicates
export const checkDuplicateScales = (
  scalesMap: Map<string, Map<string, Scale>>
): void => {
  // Create a Map to store encountered scales and their names
  const encounteredScales = new Map<string, string>();

  // Iterate through each group
  for (const [group, groupMap] of Array.from(scalesMap.entries())) {
    // Iterate through each scale within the group
    for (const [scaleName, scaleObject] of Array.from(groupMap.entries())) {
      const scaleNotes = getScaleNotes(scaleObject);
      const scaleString = JSON.stringify(scaleNotes);

      // If the scale is encountered more than once, log the duplicate
      if (encounteredScales.has(scaleString)) {
        console.log(
          `Duplicate found: Scale '${scaleName}' in '${group}' duplicates '${encounteredScales.get(
            scaleString
          )}'`
        );
      } else {
        // Otherwise, add the scale to the map
        encounteredScales.set(scaleString, scaleName);
      }
    }
  }
};

export const getScaleNotes = (scale?: Scale) => {
  if (!Array.isArray(scale)) {
    return scale?.scale;
  }
  return scale;
};

export const getScaleExamples = (scale?: Scale): Example[] | undefined => {
  if (!Array.isArray(scale)) {
    return scale?.examples;
  }
  return undefined;
};

// examples follow these rules:

// They are written for EBGDAE tuning, converting to other tunings will require shifting notes
// *4 - play 4th string onwards
// 8 - play 8th fret on the previously remembered string and pause for one step
// 1-0 - paly 10th fret following the same rules
// ^51 - immediately play 1st fret on 5th string without pausing (useful for chords)
// ^41-2 - immediately play 12th fret on 4th string following the same rules
// (<melody>)3 play <melody> for 3 times
// <Asus4> - play Asus4 chord immediately. It uses the variation closest to the neck head and the strumming delay from settings

export const scalesMap: Map<string, Map<string, Scale>> = new Map([
  [
    "Common Minor",
    new Map([
      [
        "Aeolian / Natural",
        {
          scale: [2, 3, 5, 7, 8, 10],
          examples: [
            {
              band: "Linkin Park",
              title: "Numb",
              melody:
                "_*1030*0<Em>0__3__2_<C>_____*1030*0<G>3__2*1__3_<D>_____*1030(*0 <Em> 0_ ^50 _ ^50 3_ ^50 _ ^50 2_ <C> __ ^43 _ ^43 __ ^43 *10 ^43 3 ^43 0*0 <G> 3_ ^53 _ ^53 2*1_ ^53 _ ^53 3_ <D> __ ^30 _ ^30 __*1 ^30 0 ^30 3 ^30 0)2",
            },
            {
              band: "Crematory",
              title: "The Fallen",
              melody:
                "<Em>0______*023________<C>______8_<Bm>7_5_3_5_<Em>0_____*023________<Am>^40_^40_^40_^40_^40_^40_*22_<C>*05_3_23_(<Em>0_^50_^50__^50_^50_*023_^50_^50__^50_^50_^50_^50_<C>__^43__^43_^43_8_<Bm>^427_^425_^423_^425_<Em>0_^50__^50_^50_*023_^50_^50__^50_^50_^50_^50_<Am>^40_^40_^40_^40_^40_^40_*22_<C>*05_^433_^432^433_)2",
            },
          ],
        },
      ],
      [
        "Phrygian",
        {
          scale: [1, 3, 5, 7, 8, 10],
          examples: [
            {
              band: "Кино",
              title: "Кукушка",
              melody:
                "*2<Am>2__*135_3_<C>5__35_*03_*1<G>3__*254___<G>____5420<Am>2__*135_3_<C>5__35_*03_*1<G>3__*254___<G>____545*13",
            },
          ],
        },
      ],
      [
        "Lydian",
        {
          scale: [2, 4, 6, 7, 8, 10],
          examples: [],
        },
      ],
      ["Locrian", [1, 3, 5, 6, 8, 10]],
      [
        "Melodic",
        {
          scale: [2, 3, 5, 7, 9, 11],
          examples: [],
        },
      ],
      ["Dorian", [2, 3, 5, 7, 9, 10]],
      ["Pentatonic Minor", [3, 5, 7, 10]],
    ]),
  ],
  [
    "Common Major",
    new Map([
      [
        "Ionian",
        {
          scale: [2, 4, 5, 7, 9, 11],
          examples: [
            {
              band: "Michael Jackson",
              title: "Billie Jean",
              melody:
                "(*34*44*3242*4424)2 (*3 ^12^22^34^44 4*44*32 ^14^24^36^46 42*4424 *3 ^15^26^37^47 4*44*32 ^14^24^36^46 42*4424)2",
            },
          ],
        },
      ],
      ["Pentatonic Major", [2, 4, 7, 9]],
      ["Pentatonic Dominant", [2, 4, 7, 10]],
      ["Lydian", [2, 4, 6, 7, 9, 11]],
      ["Lydian Augmented", [2, 4, 6, 8, 9, 11]],
      ["Mixolydian", [2, 4, 5, 7, 9, 10]],
    ]),
  ],
  [
    "Middle Eastern",
    new Map([
      [
        "Hijaz / Ahaba Rabba",
        {
          scale: [1, 4, 5, 7, 8, 10],
          examples: [
            {
              band: "Jewish Traditional Song",
              title: "Hava Nagila",
              melody:
                "(*0 <E> 0_0__410 <G#dim> 4_4__754 <Am> 5_5__875 <G#dim> 4101 ^540 ___)2 *0 <Caug> 88_ ^57 7555_ <Bdim> 77_ ^55 5444_ <E6> 4_75 <E6> 4_5_ <E6> 4_ ^51 1_ ^50 0",
            },
          ],
        },
      ],
      ["Arabian", [2, 4, 5, 6, 8, 10]],
      ["Persian", [1, 4, 5, 6, 8, 11]],
      ["Mohammedan / Harmonic", [2, 3, 5, 7, 8, 11]],
      ["Adonai Malakh", [1, 2, 3, 5, 7, 9, 10]],
      ["Magen Abot", [1, 3, 4, 6, 8, 10, 11]],
    ]),
  ],
  [
    "Far Eastern",
    new Map([
      ["Iwato", [1, 5, 6, 10]],
      ["Kumoi", [2, 3, 7, 9]],
      ["Kumoi 2", [1, 5, 7, 8]],
      ["In sen", [1, 5, 7, 10]],
      ["Japanese", [2, 5, 7, 8]],
      ["Ichikosucho", [2, 4, 5, 6, 7, 9, 11]],
      ["Taishikicho", [2, 4, 5, 6, 7, 9, 10, 11]],
      ["Hirajoshi", [2, 3, 7, 8]],
      ["Hirajoshi 2", [4, 5, 9, 11]],
      ["Chinese", [4, 6, 7, 11]],
      ["Chinese Yo", [2, 5, 7, 9]],
    ]),
  ],
  [
    "Gypsy",
    new Map([
      ["Byzantine", [1, 4, 5, 7, 8, 11]],
      ["Romanian", [2, 3, 7, 9, 11]],
      ["Romanian Minor", [2, 3, 6, 7, 9, 10]],
      ["Hungarian Major", [3, 4, 6, 7, 9, 10]],
      ["Hungarian Minor", [2, 3, 6, 7, 8, 11]],
    ]),
  ],
  [
    "Various Exotic",
    new Map([
      [
        "Narayan",
        {
          scale: [2, 3, 7, 9, 10],
          examples: [
            {
              band: "The Prodigy",
              title: "Narayan",
              melody:
                "(<E5>*002371-0932<E5>02371-0932<G5>*002371-0932<G5>02371-0^52932)2",
            },
          ],
        },
      ],
      ["Hindu", [2, 4, 5, 7, 8, 10]],
      ["Neapolitan", [1, 3, 5, 7, 8, 11]],
      ["Neapolitan Major", [1, 3, 5, 7, 9, 11]],
      ["Algerian", [2, 3, 5, 6, 7, 8, 11]],
      ["Pelog / Balinese", [1, 3, 7, 8]],
      ["Pelog 2", [1, 3, 7, 10]],
      ["Egyptian  / Harmonic", [2, 5, 7, 10]],
      ["Oriental 1", [1, 4, 5, 6, 11]],
      ["Oriental 2", [1, 4, 5, 6, 8, 10]],
      ["Oriental 3", [1, 4, 5, 6, 9, 10]],
      ["Eight Tone Spanish", [1, 3, 4, 5, 6, 8, 10]],
      ["Javaneese", [1, 3, 5, 7, 9, 10]],
      ["Prometheus", [2, 4, 6, 9, 10]],
      ["Prometheus Neapolitan", [1, 4, 6, 9, 10]],
      ["Moorish Phrygian", [1, 3, 4, 5, 7, 8, 10, 11]],
    ]),
  ],
  [
    "Blues",
    new Map([
      ["Blues 1", [3, 5, 6, 7, 10]],
      ["Blues 2", [3, 5, 6, 7, 10, 11]],
      ["Blues 3", [3, 4, 5, 6, 7, 10, 11]],
      ["Blues 4", [3, 4, 5, 6, 7, 9, 10, 11]],
      ["Blues Major", [2, 3, 4, 7, 9]],
      ["Mixo-Blues", [3, 4, 5, 6, 7, 10]],
    ]),
  ],
  [
    "Bebop Jazz",
    new Map([
      ["Bebop Major", [2, 4, 5, 7, 8, 9, 11]],
      ["Bebop Minor", [2, 3, 4, 5, 7, 9, 10]],
      ["Bebop Dominant", [2, 4, 5, 7, 9, 10, 11]],
      ["Bebop Half Diminished", [1, 3, 5, 6, 7, 8, 11]],
    ]),
  ],
  [
    "Special",
    new Map([
      [
        "Chromatic (All notes)",
        {
          scale: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          examples: [
            {
              tuning: tunings[1],
              band: "Test",
              title: "Test",
              melody: "*50002221-01-01-01-21-21-2",
            },
          ],
        },
      ],
      ["Whole tone", [2, 4, 6, 8, 10]],
      ["Leading whole tone", [2, 4, 6, 8, 10, 11]],
      ["Diminished", [2, 3, 5, 6, 8, 9, 11]],
      ["Diminished Half", [1, 3, 4, 6, 7, 9, 10]],
      ["Diminished Whole Tone", [1, 3, 4, 6, 8, 10]],
      ["Octatonic", [1, 3, 4, 67, 9, 10]],
      ["Augmented", [3, 4, 6, 8, 11]],
      ["Enigmatic", [1, 4, 6, 8, 10, 11]],
      ["Nine Tone", [2, 3, 4, 6, 7, 8, 9, 11]],
      ["Overtone", [2, 4, 6, 7, 9, 10]],
      ["Six Tone Symmetrical", [1, 4, 5, 8, 9]],
      ["Altered", [1, 3, 4, 6, 7, 8]],
      ["Lydian Diminished", [2, 3, 6, 7, 9, 11]],
      ["Lydian Alternative", [3, 4, 6, 7, 9, 11]],
      ["Locrian Alternative", [2, 3, 5, 6, 8, 10]],
      ["Locrian Alternative 2", [1, 3, 5, 6, 9, 10]],
      ["UltraLocrian", [1, 3, 4, 6, 8, 9, 10]],
      ["Ionian Alternative", [2, 4, 5, 8, 9, 11]],
    ]),
  ],
]);
