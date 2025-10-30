import type {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
} from "@appboxo/web-sdk";

/**
 * Creates a PaymentResponse with the given status.
 */
export function createPaymentResponse(
  paymentData: PaymentRequest,
  status: PaymentStatus,
  hostappOrderId: string
): PaymentResponse {
  return {
    ...paymentData,
    status,
    hostappOrderId,
  };
}
