import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export type PaymentMethodValue = "PAY_AT_GARAGE" | "VIETQR" | "VNPAY";
export type PaymentStatusValue = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentActionValue = "CAPTURE" | "REFUND";

export function assertValidPaymentAction(params: {
  currentStatus: PaymentStatusValue;
  action: PaymentActionValue;
  reason?: string;
}): PaymentStatusValue {
  if (params.action === "CAPTURE") {
    if (params.currentStatus !== "UNPAID") {
      throw new BusinessRuleViolationException(
        "Chỉ có thể xác nhận thu tiền cho đơn đang ở trạng thái Chưa thanh toán.",
        "INVALID_PAYMENT_CAPTURE"
      );
    }
    return "PAID";
  }

  if (params.currentStatus !== "PAID") {
    throw new BusinessRuleViolationException(
      "Chỉ có thể hoàn tiền cho đơn đã thanh toán.",
      "INVALID_PAYMENT_REFUND"
    );
  }

  if (!params.reason?.trim()) {
    throw new BusinessRuleViolationException(
      "Vui lòng nhập lý do hoàn tiền.",
      "PAYMENT_REFUND_REASON_REQUIRED"
    );
  }

  return "REFUNDED";
}

