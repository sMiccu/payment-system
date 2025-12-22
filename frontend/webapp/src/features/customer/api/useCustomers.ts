"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Customer, CustomerApiResponse } from "../types";

type UseCustomersResult = {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  reload: () => Promise<void>;
};

const extractTime = (datetime: string | null): string => {
  if (!datetime) return "--:--";
  const date = new Date(datetime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const useCustomers = (): UseCustomersResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<CustomerApiResponse[]>("/customer/api/customer/");

      // 来店中の顧客のみをフィルタリング（end_datetimeがnullのもの）
      const activeCustomers = data.filter(
        (customer) => customer.end_datetime === null,
      );

      // 表示用の形式に変換
      const formattedCustomers: Customer[] = activeCustomers.map(
        (customer) => ({
          id: customer.id.toString(),
          name: customer.name,
          startTime: extractTime(customer.start_datetime),
          isBreaking: customer.is_breaking,
          startDatetime: customer.start_datetime,
          endDatetime: customer.end_datetime,
          isMember: customer.membership !== null,
        }),
      );

      setCustomers(formattedCustomers);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setError(`顧客データの取得に失敗しました: ${message}`);
      console.error("Failed to fetch customers:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    isLoading,
    error,
    setError,
    setCustomers,
    reload: fetchCustomers,
  };
};


