import { Tuning } from "./tunings";

export type Example = {
  band: string;
  title: string;
  melodyTracks: string[];
  tuning?: Tuning;
  tempo?: number;
};

export const examplesMap: Map<string, Map<string, Example[]>> = new Map([
  [
    "Common Minor",
    new Map([
      [
        "Aeolian / Natural",
        [
          {
            band: "Linkin Park",
            title: "Numb",
            tempo: 110,
            melodyTracks: [
              "_*1030(*00__3__2_<C>_____*1030*03__2*1__3______*1030)3",
              "____(<Em>________<C>________<G>________<D>________)3",
              "____(________)4(*5__00_000*4__33_333*5__33_333*3__00_000)2",
            ],
          },
          {
            band: "Crematory",
            title: "The Fallen",
            tempo: 168,
            melodyTracks: [
              "(0______*023______________8_7_5_3_5_0_____*023______________*22_*05_3_23_)3",
              "<Em>________________<C>________<Bm>________<Em>________________<C>________<Am>_____<E5>___(<E5>_______<E5>_________<C5>________<B5>________<E5>_______<E5>_________<C5>________<A5>__<A5>__<A5>_<A5>___)2",
              "(________)6*4000000_______0__(*50_0_0000_00_0000*43_3_333_2_2_2_2_*50_0_0000_00_0000*43333333300000___)2",
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
            melodyTracks: [
              "*22__*135_3_5__35_*03_*13__*254_______54202__*135_3_5__35_*03_*13__*254_______545*13",
              "(<Am>________<C>________<G>________<G>________)2",
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
            melodyTracks: [
              "_(*37*21-09<Dm>7 *30*22 *291-0 *30 *01-0_<F>8 *33*22 *01-08 *43 *11-06<C>8 *32*20 *25*086*11-08<Gm>1-1 *45*35 *11-08*53*1<Am>6_<A#>*27 *33*23*13*11-5 *27*15_<Dm>6 *30 *15*27<Am>5 *32 *2*37_<G>1-279*53*45*35*24*13<G>*03*45*24*42*30)2",
            ],
          },
        ],
      ],
    ]),
  ],
  [
    "Common Major",
    new Map([
      [
        "Ionian",
        [
          {
            band: "Michael Jackson",
            title: "Billie Jean",
            tempo: 116,
            melodyTracks: [
              "(*34*44*3242*4424)6",
              "(________)2(^12^22^34^44 ___ ^14^24^36^46 _____ ^15^26^37^47 ___ ^14^24^36^46 _____)2",
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
            melodyTracks: [
              "(*00_0__4104_4__7545_5__87541010___)2 *088_7555_77_5444_4_75 4_5_4_1_0",
              "*5(<E>________<G#dim>________<Am>________<G#dim>____4___)2 <Caug>___7____<Bdim>___5____<E6>____<E6>____<E6>__1_0",
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
            melodyTracks: [
              "(*002371-0932)1-6",
              "*5(<E5>________<E5>________<G5>________<G5>_____2__)4",
              "*5(________)8(00_000__00_000_033_333__33_332_2)2",
            ],
          },
        ],
      ],
    ]),
  ],
]);

export const getScaleExamples = (
  group: string,
  scale: string
): Example[] | undefined => {
  const groupScales = examplesMap.get(group);
  return groupScales?.get(scale);
};
