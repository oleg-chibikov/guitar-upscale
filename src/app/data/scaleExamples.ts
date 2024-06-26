import { loadInstrument } from "../engine/sound/soundHelper";
import {
  reverbStrengthValue,
  scaleGroupValue,
  scaleValue,
} from "../store/settingsSlice";
import { Example } from "./example";

export const examplesMap: Map<string, Map<string, Example[]>> = new Map([
  [
    "Minor",
    new Map([
      [
        "Aeolian / Natural",
        [
          {
            band: "Linkin Park",
            title: "Numb",
            tempo: 110,
            halfBeatShift: 3,
            tracks: [
              {
                melody: "*1030(*00__3__2______*1030*03__2*1__3______*1030)3",
              },
              {
                melody: "___(<Em>________<C>________<G>________<D>________)3",
              },
              {
                instrument: "acoustic_guitar_nylon",
                melody:
                  "___(________)4(*5__00_000*4__33_333*5__33_333*3__00_000)2",
              },
            ],
          },
          {
            band: "Crematory",
            title: "The Fallen",
            tempo: 168,
            tracks: [
              {
                melody:
                  "(0______*023______________8_7_5_3_5_0_____*023______________*22_*05_3_23_)3",
              },
              {
                melody:
                  "<Em>________________<C>________<Bm>________<Em>________________<C>________<Am>________(<E5>_______<E5>_________<C5>________<B5>________<E5>_______<E5>_________<C5>________<A5>__<A5>__<A5>_<A5>___)2",
              },
              {
                instrument: "acoustic_guitar_nylon",
                melody:
                  "(________)6*4000000_______*50__(*50_0_0000_00_0000*43_3_333_2_2_2_2_*50_0_0000_00_0000*43333333300000___)2",
              },
            ],
          },
        ],
      ],
      [
        "Phrygian",
        [
          {
            band: "Кино",
            title: "Кукушка",
            tempo: 105,
            tracks: [
              {
                melody:
                  "*22__*135_3_5__35_*03_*13__*254_______54202__*135_3_5__35_*03_*13__*254_______545*13",
              },
              {
                melody: "(<Am>________<C>________<G>________<G>________)2",
              },
            ],
          },
        ],
      ],
      [
        "Locrian + Major",
        [
          {
            band: "Two Steps From Hell",
            title: "Emerald Princess",
            tempo: 64,
            halfBeatShift: 3,
            tracks: [
              {
                melody:
                  "(*37*21-097 __ *291-0 _ *01-0_8 __ *01-08 _ *11-068 __ *25*086*11-081-1 __ *11-08*53*16_*27 ____ *27*15_6 _ *15*275 _ *2*37_1-279_____*03*45*24__)2",
              },
              {
                melody:
                  "___(<Dm>________<F>________<C>________<Gm>______<Am>__<A#>________<Dm>____<Am>____<G>________<G>________)2",
              },
              {
                instrument: "xylophone",
                melody:
                  "(____ *30*22 __*30 ___ *33*22 __ *43 ___ *32*20 ______ *45*35 ______ *33*23*13*11-5 ____ *30 ___ *32 _____*53*45*35*24*13___*42*30)2",
              },
            ],
          },
        ],
      ],
    ]),
  ],
  [
    "Major",
    new Map([
      [
        "Ionian",
        [
          {
            band: "Michael Jackson",
            title: "Billie Jean",
            tempo: 116,
            tracks: [
              { melody: "(*34*44*3242*4424)6" },
              {
                instrument: "electric_guitar_clean",
                melody:
                  "(________)2(^12^22^34^44 ___ ^14^24^36^46 _____ ^15^26^37^47 ___ ^14^24^36^46 _____)2",
              },
              {
                melody:
                  "(________)2(<F#m> ___ <G#m> _____ <A> ___ <G#m> _____)2",
              },
            ],
          },
        ],
      ],
    ]),
  ],
  [
    "Middle Eastern",
    new Map([
      [
        "Hijaz / Ahaba Rabba",
        [
          {
            band: "Jewish Traditional Song",
            title: "Hava Nagila",
            tempo: 125,
            tracks: [
              {
                melody:
                  "(*00_0__4104_4__7545_5__87541010___)2 *088_7555_77_5444_4_75 4_5_4_1_0",
              },
              {
                melody:
                  "*5(<E>________<G#dim>________<Am>________<G#dim>____4___)2 <Caug>___7____<Bdim>___5____<E7>____<E7>____<E7>__1_0",
              },
            ],
          },
        ],
      ],
    ]),
  ],
  [
    "Various Exotic",
    new Map([
      [
        "Narayan",
        [
          {
            band: "The Prodigy",
            title: "Narayan",
            tempo: 129,
            tracks: [
              { melody: "(*002371-0932)1-6" },
              {
                melody: "*5(<E5>________<E5>________<G5>________<G5>_____2__)4",
              },
              {
                instrument: "synth_bass_1",
                melody: "*5(________)8(00_000__00_000_033_333__33_332_2)2",
              },
            ],
          },
        ],
      ],
    ]),
  ],
]);

const getRandomRecord = <T>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

export const wipeExamplesCache = () => {
  console.log("Wiping example cache");
  for (const [_scaleGroup, mapForScaleGroup] of Array.from(
    examplesMap.entries()
  )) {
    for (const [_scale, examples] of Array.from(mapForScaleGroup.entries())) {
      for (const example of examples) {
        example.decodedTracks = undefined;
      }
    }
  }
};

export const getRandomScaleExample = async (): Promise<Example | undefined> => {
  const groupScales = examplesMap.get(scaleGroupValue);
  const examples = groupScales?.get(scaleValue);
  if (!examples) {
    return;
  }

  const instrumentLoadPromises = examples?.flatMap((example) =>
    example.tracks.map(async (track) => {
      if (track.instrument !== undefined) {
        await loadInstrument(track.instrument, reverbStrengthValue);
      }
    })
  );
  await Promise.all(instrumentLoadPromises);
  return getRandomRecord(examples);
};
