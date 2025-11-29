"use client";

import * as React from "react";
import {
  fetchCustomerQuote,
  type CustomerQuoteResponse,
} from "@/lib/api";

type UseTimeQuoteResult = {
  quote: CustomerQuoteResponse | null;
  loading: boolean;
  error: string | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  setStartDate: (value: string) => void;
  setStartTime: (value: string) => void;
  setEndDate: (value: string) => void;
  setEndTime: (value: string) => void;
  refetch: () => Promise<void>;
};

const buildIso = (dateStr: string, timeStr: string): string | undefined => {
  if (!dateStr || !timeStr) return undefined;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return undefined;
  }
  const d = new Date(year, month - 1, day, hour, minute, 0);
  return d.toISOString();
};

export function useTimeQuote(
  customerId: string | null,
): UseTimeQuoteResult {
  const [quote, setQuote] = React.useState<CustomerQuoteResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [startDate, setStartDate] = React.useState<string>("");
  const [startTime, setStartTime] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [endTime, setEndTime] = React.useState<string>("");

  const fetchQuote = React.useCallback(
    async (override?: {
      startDate?: string;
      startTime?: string;
      endDate?: string;
      endTime?: string;
    }) => {
      if (!customerId) return;
      setLoading(true);
      setError(null);
      try {
        const effStartDate = override?.startDate ?? startDate;
        const effStartTime = override?.startTime ?? startTime;
        const effEndDate = override?.endDate ?? endDate;
        const effEndTime = override?.endTime ?? endTime;

        const startDt = buildIso(effStartDate, effStartTime);
        const endDt = buildIso(effEndDate, effEndTime);

        const res = await fetchCustomerQuote(customerId, {
          start_dt: startDt || undefined,
          end_dt: endDt || undefined,
        });
        setQuote(res);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "見積取得に失敗しました";
        setError(msg);
        console.error("Failed to fetch customer quote:", e);
      } finally {
        setLoading(false);
      }
    },
    [customerId, startDate, startTime, endDate, endTime],
  );

  React.useEffect(() => {
    if (!customerId) return;
    // デフォルトで本日の日付をセットし、その条件で初回見積を取得
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const dd = today.getDate().toString().padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    setStartDate(todayStr);
    setEndDate(todayStr);

    void fetchQuote({
      startDate: todayStr,
      endDate: todayStr,
    });
  }, [customerId, fetchQuote]);

  const refetch = React.useCallback(async () => {
    await fetchQuote();
  }, [fetchQuote]);

  return {
    quote,
    loading,
    error,
    startDate,
    startTime,
    endDate,
    endTime,
    setStartDate,
    setStartTime,
    setEndDate,
    setEndTime,
    refetch,
  };
}


