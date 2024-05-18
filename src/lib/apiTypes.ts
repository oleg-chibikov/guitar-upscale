import { CancelReason } from "./billing";
import { Tier } from "./tier";

export type ResponseData = {
  message?: string;
  error?: string;
};

export type SubscriptionActionResponseData = ResponseData & {
  newTier: Tier;
  tierChanged: boolean;
};

export type PurchaseResponseData = ResponseData & {
  data?: PurchaseData;
};

export type ChangeAction = "Upgrade" | "Downgrade";

export type ChangeResponseData = SubscriptionActionResponseData & {
  changeAction: ChangeAction;
  wasDeferred: boolean;
};

export type PurchaseData = {
  cancellationReason: CancelReason;
  cancellationMode: CancellationMode;
  expirationDateMs: number;
  subscribedDateMs: number;
};

export enum CancellationMode {
  Cancel,
  Revoke,
}
