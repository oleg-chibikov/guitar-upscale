import {
  PremiumFeatureKeys,
  PremiumFeatures,
  PremiumFeaturesWithSession,
} from "@/lib/premiumFeatures";
import { ReactNode } from "react";

export interface WithPremiumFeaturesWithSession {
  premiumFeatures: PremiumFeaturesWithSession;
}

export interface WithPremiumFeatures {
  premiumFeatures: PremiumFeatures;
}

export type PremiumComponent = ReactNode;

export interface WithPremiumComponents {
  premiumComponents: Map<PremiumFeatureKeys, PremiumComponent>;
}
