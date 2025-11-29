"use client";

import * as React from "react";
import { createOrder, type CreateOrderItem } from "@/lib/api";

type UseCreateOrderOptions = {
  customerId: string | null;
  onSuccess?: () => void;
};

type UseCreateOrderResult = {
  create: (items: CreateOrderItem[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
};

export function useCreateOrder({
  customerId,
  onSuccess,
}: UseCreateOrderOptions): UseCreateOrderResult {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const create = React.useCallback(
    async (items: CreateOrderItem[]) => {
      if (!customerId) {
        setError("顧客IDが指定されていません。");
        return;
      }
      if (items.length === 0) return;

      setIsSubmitting(true);
      setError(null);
      try {
        await createOrder({ customer_id: Number(customerId), items });
        onSuccess?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "注文の作成に失敗しました";
        setError(msg);
        console.error("Failed to create order:", e);
      } finally {
        setIsSubmitting(false);
      }
    },
    [customerId, onSuccess],
  );

  return {
    create,
    isSubmitting,
    error,
  };
}


