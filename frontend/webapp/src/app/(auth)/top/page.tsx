"use client";

import type { NextPage } from "next";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Customer } from "@/features/customer/types";
import { useCustomers } from "@/features/customer/api/useCustomers";
import { useCustomerDetailsMap } from "@/features/customer/api/useCustomerDetailsMap";
import { CustomerDetails } from "@/components/features/customer/CustomerDetails";
import { MembershipSection } from "@/components/features/customer/MembershipSection";
import { CustomerRow } from "@/components/features/customer/CustomerRow";

const Page: NextPage = () => {
  const router = useRouter();
  const {
    customers,
    isLoading,
    error,
    setError,
    setCustomers,
  } = useCustomers();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const {
    breaksMap,
    breaksLoading,
    breaksError,
    orderSummaryMap,
    quoteMap,
    summaryLoading,
    fetchCustomerData,
  } = useCustomerDetailsMap(expanded);

  const toggleBreak = async (customerId: string, isBreaking: boolean) => {
    try {
      setError(null);
      if (isBreaking) {
        await apiFetch(`/customer/api/customer/${customerId}/resume/`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      } else {
        await apiFetch(`/customer/api/customer/${customerId}/pause/`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      }
      setCustomers((prev: Customer[]) =>
        prev.map((c: Customer) =>
          c.id === customerId ? { ...c, isBreaking: !isBreaking } : c
        )
      );
      
      // 展開中なら即座にデータを更新
      if (expanded[customerId]) {
        fetchCustomerData(customerId);
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setError(`休止/再開の操作に失敗しました: ${errorMessage}`);
      console.error("Failed to toggle break:", e);
    }
  };

  const toggleExpand = async (customerId: string) => {
    const next = !expanded[customerId];
    setExpanded((prev: Record<string, boolean>) => ({
      ...prev,
      [customerId]: next,
    }));

    // 展開されたタイミングで、まだ詳細がなければロード
    if (next && !breaksMap[customerId] && !breaksLoading[customerId]) {
      await fetchCustomerData(customerId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* 来店登録ボタン */}
      <div className="mb-8 animate-slide-in-up">
        <Button
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 text-white font-medium text-base px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-primary/50"
          size="lg"
          onClick={() => router.push("/customer-register")}
        >
          来店登録
        </Button>
      </div>

      {/* 顧客リスト */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-foreground animate-slide-in-left">来店中のお客様</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="h-20 surface-elevated rounded-lg border border-border/50 animate-pulse"
              >
                <div className="h-full p-4 flex items-center gap-4">
                  <div className="h-4 bg-muted/30 rounded w-1/4 animate-shimmer"></div>
                  <div className="h-4 bg-muted/30 rounded w-1/4 animate-shimmer"></div>
                  <div className="ml-auto flex gap-2">
                    <div className="h-8 w-16 bg-muted/30 rounded"></div>
                    <div className="h-8 w-16 bg-muted/30 rounded"></div>
                    <div className="h-8 w-16 bg-muted/30 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive animate-fade-in">
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground animate-fade-in">
            来店中の顧客はいません
          </div>
        ) : (
          customers.map((customer, index) => (
            <div key={customer.id}>
              <CustomerRow
                customer={customer}
                expanded={!!expanded[customer.id]}
                animationDelayMs={index * 50}
                onToggleExpand={() => {
                  void toggleExpand(customer.id);
                }}
                onToggleBreak={() => {
                  void toggleBreak(customer.id, customer.isBreaking);
                }}
                onOrder={() => {
                  router.push(
                    `/order?customerId=${customer.id}&customerName=${encodeURIComponent(
                      customer.name,
                    )}`,
                  );
                }}
                onPayment={() => {
                  router.push(
                    `/payment?customerId=${customer.id}&customerName=${encodeURIComponent(
                      customer.name,
                    )}`,
                  );
                }}
              />
              {expanded[customer.id] && (
                <CustomerDetails
                  customer={customer}
                  breaks={breaksMap[customer.id] ?? []}
                  orderSummary={orderSummaryMap[customer.id]}
                  quote={quoteMap[customer.id]}
                  breaksLoading={!!breaksLoading[customer.id]}
                  summaryLoading={!!summaryLoading[customer.id]}
                  breakError={breaksError[customer.id]}
                />
              )}
              {/* 非会員向け 会員紐付けUI */}
              {expanded[customer.id] && !customer.isMember && (
                <MembershipSection
                  customerId={customer.id}
                  onLinked={() => {
                    // 顧客一覧の状態を会員として更新
                    setCustomers((prev) =>
                      prev.map((c) =>
                        c.id === customer.id ? { ...c, isMember: true } : c,
                      ),
                    );
                    // 料金などの詳細も会員価格で再取得
                    void fetchCustomerData(customer.id);
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Page;


