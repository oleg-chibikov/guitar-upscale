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

export type GetPurchaseResponseData = ResponseData & {
  data?: PurchaseData;
};

export type PurchaseAction = "Upgrade" | "Downgrade" | "Purchase";

export type ChangeSubscriptionActionResponseData =
  SubscriptionActionResponseData & {
    changeAction: PurchaseAction;
    wasDeferred: boolean;
  };

export type PurchaseData = {
  cancellationReason?: CancelReason;
  cancellationMode: CancellationMode;
  expirationDateMs: number;
  subscribedDateMs: number;
};

export enum CancellationMode {
  Cancel,
  Revoke,
}
