export const Skin = {
  Guitar1: "Guitar1",
  Guitar2: "Guitar2",
  Guitar3: "Guitar3",
  Guitar4: "Guitar4",
} as const;

export const SevenStringSkin = {
  Guitar5: "Guitar5", // electric 7 string
} as const;

export const EightStringSkin = {
  Guitar6: "Guitar6", // electric 8 string
} as const;

export type SkinType = (typeof Skin)[keyof typeof Skin];
export type SevenStringSkinType =
  (typeof SevenStringSkin)[keyof typeof SevenStringSkin];
export type EightStringSkinType =
  (typeof EightStringSkin)[keyof typeof EightStringSkin];
export type CombinedSkinType =
  SkinType | SevenStringSkinType | EightStringSkinType;
