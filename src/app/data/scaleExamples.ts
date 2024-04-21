import { Tuning } from "./notes";

export type Example = {
  band: string;
  title: string;
  melody: string;
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
            melody:
              "_*1030*0<Em>0__3__2_<C>_____*1030*0<G>3__2*1__3_<D>_____*1030(*0 <Em> 0_ ^50 _ ^50 3_ ^50 _ ^50 2_ <C> __ ^43 _ ^43 __ ^43 *10 ^43 3 ^43 0*0 <G> 3_ ^53 _ ^53 2*1_ ^53 _ ^53 3_ <D> __ ^30 _ ^30 __*1 ^30 0 ^30 3 ^30 0)2",
          },
          {
            band: "Crematory",
            title: "The Fallen",
            tempo: 168,
            melody:
              "<Em>0______*023________<C>______8_<Bm>7_5_3_5_<Em>0_____*023________<Am>^40_^40_^40_^40_^40_^40_*22_<C>*05_3_23_(<Em>0_^50_^50__^50_^50_*023_^50_^50__^50_^50_^50_^50_<C>__^43__^43_^43_8_<Bm>^427_^425_^423_^425_<Em>0_^50__^50_^50_*023_^50_^50__^50_^50_^50_^50_<Am>^40_^40_^40_^40_^40_^40_*22_<C>*05_^433_^432^433_)2",
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
            melody:
              "*2<Am>2__*135_3_<C>5__35_*03_*1<G>3__*254___<G>____5420<Am>2__*135_3_<C>5__35_*03_*1<G>3__*254___<G>____545*13",
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
            melody:
              "(_*37*21-09<Dm>7 *30*22 *291-0_*01-0_<F>8 *33*22 *01-08_*11-06<C>8 *32*20 *25*086*11-08<Gm>1-1 *45*35 *11-08_6_<A#>*27 *33*23 __*27*15_<Dm>6 *30 *15*27<Am>5 *32 *2*37_<G>1-279_____<G>*03*45*24_)2",
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
            melody:
              "(*34*44*3242*4424)2 (*3 ^12^22^34^44 4*44*32 ^14^24^36^46 42*4424 *3 ^15^26^37^47 4*44*32 ^14^24^36^46 42*4424)2",
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
            melody:
              "(*0 <E> 0_0__410 <G#dim> 4_4__754 <Am> 5_5__875 <G#dim> 4101 ^540 ___)2 *0 <Caug> 88_ ^57 7555_ <Bdim> 77_ ^55 5444_ <E6> 4_75 <E6> 4_5_ <E6> 4_ ^51 1_ ^50 0",
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
            melody:
              "(<E5>*002371-0932<E5>02371-0932<G5>*002371-0932<G5>02371-0^52932)2",
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
