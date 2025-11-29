"use client";

import * as React from "react";
import {
  fetchCustomerPaymentSummary,
  type PaymentSummaryResponse,
} from "@/lib/api";

type UseOrderSummaryResult = {
  orderSummary: PaymentSummaryResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useOrderSummary(
  customerId: string | null,
): UseOrderSummaryResult {
  const [orderSummary, setOrderSummary] =
    React.useState<PaymentSummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomerPaymentSummary(customerId);
      setOrderSummary(res);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "注文内訳の取得に失敗しました";
      setError(msg);
      console.error("Failed to fetch payment summary:", e);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    orderSummary,
    loading,
    error,
    reload: load,
  };
}


