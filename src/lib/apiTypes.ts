import { CancelReason } from "./billing";

export type ResponseData = {
  message?: string;
  error?: string;
};

export type PurchaseResponseData = ResponseData & {
  cancellationReason?: CancelReason;
  cancellationMode?: CancellationMode;
};

export enum CancellationMode {
  Cancel,
  Revoke,
}
