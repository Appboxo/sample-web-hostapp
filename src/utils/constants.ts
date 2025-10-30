import type { PaymentStatus } from "@appboxo/web-sdk";

/**
 * Payment status constants that match the SDK's PaymentStatus type
 */
export const PaymentStatusValues: Record<"Success" | "Failed" | "Cancelled", PaymentStatus> = {
  Success: "success",
  Failed: "failed",
  Cancelled: "cancelled",
} as const;
