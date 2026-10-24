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
      return "/guitar.webp";
    case Skin.Guitar2:
      return "/guitar2.webp";
    case Skin.Guitar3:
      return "/guitar3.webp";
    case Skin.Guitar4:
      return "/guitar4.webp";
    case SevenStringSkin.Guitar5:
      return "/guitar5.webp";
    case EightStringSkin.Guitar6:
      return "/guitar6.webp";
  }
};

export const getPositionForSkin = (skin?: CombinedSkinType) => {
  switch (skin) {
    case Skin.Guitar1:
    case undefined:
      return {
        top: -584,
        left: -455,
        xShift: 450,
      };
    case Skin.Guitar2:
      return {
        top: -593,
        left: -544,
        xShift: 450,
      };
    case Skin.Guitar3:
      return {
        top: -578,
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
        top: -588,
        left: -699,
        xShift: 450,
      };

    case EightStringSkin.Guitar6:
      return {
        top: -562,
        left: -672,
        xShift: 450,
      };
  }
};

// The strings fan out from the neck axis in straight lines. A note moves by
// slope * x * (string - center), where x is its distance in px from fret 0.
export interface StringTilt {
  slope: number;
  center: number;
}

export const getParametersForSkin = (
  skin?: CombinedSkinType,
): { height: number; widthStep: number; stringTilt: StringTilt } => {
  switch (skin) {
    case Skin.Guitar1:
    default:
      return {
        height: 23.8,
        widthStep: 10.25,
        stringTilt: { slope: 0.00626, center: 2.91 },
      };
    case Skin.Guitar2:
      return {
        height: 25.3,
        widthStep: 10.2,
        stringTilt: { slope: 0.00527, center: 2.88 },
      };
    case Skin.Guitar3:
      return {
        height: 27.5,
        widthStep: 10.56,
        stringTilt: { slope: 0.00613, center: 2.49 },
      };
    case Skin.Guitar4:
      return {
        height: 29.3,
        widthStep: 10.85,
        stringTilt: { slope: 0.00532, center: 2.37 },
      };
    case SevenStringSkin.Guitar5:
      return {
        height: 20.7,
        widthStep: 9.95,
        stringTilt: { slope: 0.00537, center: 2.22 },
      };
    case EightStringSkin.Guitar6:
      return {
        height: 23.5,
        widthStep: 10.85,
        stringTilt: { slope: 0.00507, center: 3.46 },
      };
  }
};
