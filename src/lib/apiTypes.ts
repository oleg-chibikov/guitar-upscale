import { CancelReason } from "./billing";

export type ResponseData = {
  message?: string;
  error?: string;
};

export type PurchaseResponseData = ResponseData & {
  data?: PurchaseData;
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
