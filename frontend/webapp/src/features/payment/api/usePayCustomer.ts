"use client";

import * as React from "react";
import { payCustomer, type PaymentMethod } from "@/lib/api";

type UsePayCustomerOptions = {
  customerId: string | null;
  onSuccess?: () => void;
};

type UsePayCustomerResult = {
  payMethod: PaymentMethod | null;
  setPayMethod: (method: PaymentMethod) => void;
  pay: () => Promise<void>;
  isPaying: boolean;
  error: string | null;
};

export function usePayCustomer({
  customerId,
  onSuccess,
}: UsePayCustomerOptions): UsePayCustomerResult {
  const [payMethod, setPayMethodState] =
    React.useState<PaymentMethod | null>(null);
  const [isPaying, setIsPaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setPayMethod = React.useCallback((method: PaymentMethod) => {
    setPayMethodState(method);
  }, []);

  const pay = React.useCallback(async () => {
    if (!customerId || !payMethod) return;
    setIsPaying(true);
    setError(null);
    try {
      await payCustomer({
        customer_id: Number(customerId),
        payment_method: payMethod,
      });
      onSuccess?.();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "会計処理に失敗しました";
      setError(msg);
      console.error("Failed to pay customer:", e);
    } finally {
      setIsPaying(false);
    }
  }, [customerId, onSuccess, payMethod]);

  return {
    payMethod,
    setPayMethod,
    pay,
    isPaying,
    error,
  };
}


