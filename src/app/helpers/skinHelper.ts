import {
  CombinedSkinType,
  EightStringSkin,
  SevenStringSkin,
  Skin,
} from "@/app/data/skin";

export const getAssetsForSkin = (skin?: CombinedSkinType) => {
  switch (skin) {
    case Skin.Guitar1:
    default:
      return [`/guitar_low.webp`, `/guitar.webp`];
    case Skin.Guitar2:
      return [`/guitar2_low.webp`, `/guitar2.webp`];
    case Skin.Guitar3:
      return [`/guitar3_low.webp`, `/guitar3.webp`];
    case Skin.Guitar4:
      return [`/guitar4_low.webp`, `/guitar4.webp`];
    case SevenStringSkin.Guitar5:
      return [`/guitar5_low.webp`, `/guitar5.webp`];
    case EightStringSkin.Guitar6:
      return [`/guitar6_low.webp`, `/guitar6.webp`];
  }
};

export const getPositionForSkin = (skin?: CombinedSkinType) => {
  switch (skin) {
    case Skin.Guitar1:
    case undefined:
      return {
        top: -583,
        left: -455,
        xShift: 450,
      };
    case Skin.Guitar2:
      return {
        top: -589,
        left: -544,
        xShift: 450,
      };
    case Skin.Guitar3:
      return {
        top: -573,
        left: -465,
        xShift: 450,
      };
    case Skin.Guitar4:
      return {
        top: -567,
        left: -520,
        xShift: 450,
      };
    case SevenStringSkin.Guitar5:
      return {
        top: -590,
        left: -699,
        xShift: 450,
      };

    case EightStringSkin.Guitar6:
      return {
        top: -561,
        left: -672,
        xShift: 450,
      };
  }
};

export const getParametersForSkin = (skin?: CombinedSkinType) => {
  switch (skin) {
    case Skin.Guitar1:
    default:
      return {
        height: 25,
        widthStep: 10.25,
        stringTiltModifiers: [3.2, 3, 2, 1, 2, 2.5, 3, 3.5],
      };
    case Skin.Guitar2:
      return {
        height: 27,
        widthStep: 10.2,
        stringTiltModifiers: [2.5, 2.2, 2, 1, 2, 2.5, 3, 3.5],
      };
    case Skin.Guitar3:
      return {
        height: 29,
        widthStep: 10.56,
        stringTiltModifiers: [2.5, 2, 1.1, -2, 2.2, 3, 3, 3.5],
      };
    case Skin.Guitar4:
      return {
        height: 30,
        widthStep: 10.85,
        stringTiltModifiers: [2.5, 2, 1.1, -2, 2.2, 3, 3, 3.5],
      };
    case SevenStringSkin.Guitar5:
      return {
        height: 21,
        widthStep: 9.95,
        stringTiltModifiers: [2.3, 1.8, 0.4, -2, 3, 3, 3.7, 4.7],
      };
    case EightStringSkin.Guitar6:
      return {
        height: 24,
        widthStep: 10.85,
        stringTiltModifiers: [3.3, 3.3, 2.8, 2, 1, 1.8, 2.6, 2.7],
      };
  }
};
