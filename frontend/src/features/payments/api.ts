import { apiRequest } from "@/lib/api-client";
import type { CreatePaymentInput, Payment, PaymentDetail } from "./types";

export function createPayment(input: CreatePaymentInput) {
  return apiRequest<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listPayments() {
  return apiRequest<PaymentDetail[]>("/payments");
}
