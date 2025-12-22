"use client";

import * as React from "react";
import {
  apiFetch,
  fetchCustomerPaymentSummary,
  fetchCustomerQuote,
  type CustomerQuoteResponse,
  type PaymentSummaryResponse,
} from "@/lib/api";
import type { CustomerBreak } from "../types";

type ExpandedMap = Record<string, boolean>;

type UseCustomerDetailsMapResult = {
  breaksMap: Record<string, CustomerBreak[]>;
  breaksLoading: Record<string, boolean>;
  breaksError: Record<string, string | null>;
  orderSummaryMap: Record<string, PaymentSummaryResponse>;
  quoteMap: Record<string, CustomerQuoteResponse>;
  summaryLoading: Record<string, boolean>;
  fetchCustomerData: (customerId: string) => Promise<void>;
};

export const useCustomerDetailsMap = (
  expanded: ExpandedMap,
): UseCustomerDetailsMapResult => {
  const [breaksMap, setBreaksMap] = React.useState<Record<string, CustomerBreak[]>>(
    {},
  );
  const [breaksLoading, setBreaksLoading] = React.useState<Record<string, boolean>>(
    {},
  );
  const [breaksError, setBreaksError] = React.useState<
    Record<string, string | null>
  >({});

  const [orderSummaryMap, setOrderSummaryMap] = React.useState<
    Record<string, PaymentSummaryResponse>
  >({});
  const [quoteMap, setQuoteMap] = React.useState<
    Record<string, CustomerQuoteResponse>
  >({});
  const [summaryLoading, setSummaryLoading] = React.useState<
    Record<string, boolean>
  >({});

  // お客様データを取得する共通関数（読み込み状態の更新も含む）
  const fetchCustomerData = React.useCallback(async (customerId: string) => {
    setBreaksLoading((prev: Record<string, boolean>) => ({
      ...prev,
      [customerId]: true,
    }));
    setSummaryLoading((prev: Record<string, boolean>) => ({
      ...prev,
      [customerId]: true,
    }));
    try {
      const [breaks, orderSummary, quote] = await Promise.all([
        apiFetch<CustomerBreak[]>(
          `/customer/api/customer_break/?customer=${customerId}`,
        ),
        fetchCustomerPaymentSummary(customerId),
        fetchCustomerQuote(customerId),
      ]);

      setBreaksMap((prev: Record<string, CustomerBreak[]>) => ({
        ...prev,
        [customerId]: breaks,
      }));
      setOrderSummaryMap((prev: Record<string, PaymentSummaryResponse>) => ({
        ...prev,
        [customerId]: orderSummary,
      }));
      setQuoteMap((prev: Record<string, CustomerQuoteResponse>) => ({
        ...prev,
        [customerId]: quote,
      }));
      setBreaksError((prev: Record<string, string | null>) => ({
        ...prev,
        [customerId]: null,
      }));
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setBreaksError((prev: Record<string, string | null>) => ({
        ...prev,
        [customerId]: `データの取得に失敗しました: ${errorMessage}`,
      }));
    } finally {
      setBreaksLoading((prev: Record<string, boolean>) => ({
        ...prev,
        [customerId]: false,
      }));
      setSummaryLoading((prev: Record<string, boolean>) => ({
        ...prev,
        [customerId]: false,
      }));
    }
  }, []);

  // 展開中のお客様のデータを定期的に更新（30秒ごと）
  React.useEffect(() => {
    const expandedIds = Object.entries(expanded)
      .filter(([, isExpanded]) => isExpanded)
      .map(([id]) => id);

    if (expandedIds.length === 0) {
      return; // 展開中のお客様がいない場合は何もしない
    }

    // 初回は即座に更新
    expandedIds.forEach((customerId) => {
      fetchCustomerData(customerId).catch((e: unknown) => {
        console.error("Failed to fetch customer details:", e);
      });
    });

    // 30秒ごとに更新
    const interval = setInterval(() => {
      expandedIds.forEach((customerId) => {
        fetchCustomerData(customerId).catch((e: unknown) => {
          console.error("Failed to refresh customer details:", e);
        });
      });
    }, 30000); // 30秒

    return () => clearInterval(interval);
  }, [expanded, fetchCustomerData]);

  return {
    breaksMap,
    breaksLoading,
    breaksError,
    orderSummaryMap,
    quoteMap,
    summaryLoading,
    fetchCustomerData,
  };
};

