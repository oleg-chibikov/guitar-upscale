import { Tier } from "./tiers";

export enum SubscriptionProvider {
  Patreon,
  GooglePlay,
}

export type TierInfo = {
  tier: Tier;
  provider: SubscriptionProvider;
};
