"use client";

import * as React from "react";
import { fetchOrderHistory, type OrderHistoryItem } from "@/lib/api";

type UseOrderHistoryResult = {
  orderHistory: OrderHistoryItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useOrderHistory(customerId: string | null): UseOrderHistoryResult {
  const [orderHistory, setOrderHistory] = React.useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchOrderHistory(customerId);
      setOrderHistory(res);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "注文履歴の取得に失敗しました";
      setError(msg);
      console.error("Failed to fetch order history:", e);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    orderHistory,
    isLoading,
    error,
    reload: load,
  };
}


