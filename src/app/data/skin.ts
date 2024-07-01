export const Skin = {
  PRS_SE_AX20E: "PRS_SE_AX20E",
  Ibanez_AE140_WKH: "Ibanez_AE140_WKH",
  Yamaha_CSF3M: "Yamaha_CSF3M",
  Yamaha_SLG200NW: "Yamaha_SLG200NW",
} as const;

export const SevenStringSkin = {
  Diablo_Baritone: "Diablo_Baritone", // electric 7 string
} as const;

export const EightStringSkin = {
  Ibanez_RG9PB_TGF: "Ibanez_RG9PB_TGF", // electric 8 string
} as const;

export type SkinType = (typeof Skin)[keyof typeof Skin];
export type SevenStringSkinType =
  (typeof SevenStringSkin)[keyof typeof SevenStringSkin];
export type EightStringSkinType =
  (typeof EightStringSkin)[keyof typeof EightStringSkin];
export type CombinedSkinType =
  | SkinType
  | SevenStringSkinType
  | EightStringSkinType;
