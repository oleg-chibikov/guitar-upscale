import { Skin } from "../store/controlPanelSlice";

export const getAssetsForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    default:
      return [`/guitar_low.webp`, `/guitar_full.webp`];
    case Skin.Ibanez_AE140_WKH:
      return [`/guitar2_low.webp`, `/guitar2_full.webp`];
    case Skin.Yamaha_CSF3M:
      return [`/guitar3_low.webp`, `/guitar3_full.webp`];
    case Skin.Yamaha_SLG200NW:
      return [`/guitar4_low.webp`, `/guitar4_full.webp`];
  }
};
