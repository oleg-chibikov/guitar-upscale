import { Skin } from "@/app/data/skin";

export const getAssetsForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    default:
      return [`/guitar_low.webp`, `/guitar.webp`];
    case Skin.Ibanez_AE140_WKH:
      return [`/guitar2_low.webp`, `/guitar2.webp`];
    case Skin.Yamaha_CSF3M:
      return [`/guitar3_low.webp`, `/guitar3.webp`];
    case Skin.Yamaha_SLG200NW:
      return [`/guitar4_low.webp`, `/guitar4.webp`];
    case Skin.Dean_MichaelAngelo_Batio_MAB7_Warrior:
      return [`/guitar5_low.webp`, `/guitar5.webp`];
    case Skin.Ibanez_RG9PB_TGF:
      return [`/guitar6_low.webp`, `/guitar6.webp`];
  }
};
