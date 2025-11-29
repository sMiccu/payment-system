"use client";

import type { NextPage } from "next";
import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTimeQuote } from "@/features/payment/api/useTimeQuote";
import { useOrderSummary } from "@/features/payment/api/useOrderSummary";
import { usePayCustomer } from "@/features/payment/api/usePayCustomer";
import { PaymentFilters } from "@/components/features/payment/PaymentFilters";
import { PaymentDetails } from "@/components/features/payment/PaymentDetails";
import { PaymentActions } from "@/components/features/payment/PaymentActions";

const TAX_RATE = 0.1;

const PaymentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const customerName = searchParams.get("customerName");

  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
    startDate,
    startTime,
    endDate,
    endTime,
    setStartDate,
    setStartTime,
    setEndDate,
    setEndTime,
    refetch,
  } = useTimeQuote(customerId);

  const {
    orderSummary,
    loading: orderLoading,
    error: orderError,
  } = useOrderSummary(customerId);

  const {
    payMethod,
    setPayMethod,
    pay,
    isPaying,
    error: payError,
  } = usePayCustomer({
    customerId,
    onSuccess: () => {
      router.push("/top");
    },
  });

  const toNumber = (s?: string | null) => {
    if (!s) return 0;
    const n = Number(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const grandTotal = React.useMemo(() => {
    const quoteSubtotal = toNumber(quote?.subtotal ?? "0");
    const orderTotal = toNumber(orderSummary?.order_total ?? "0");
    return quoteSubtotal + orderTotal;
  }, [quote, orderSummary]);

  const taxAmount = React.useMemo(() => {
    return Math.floor(grandTotal * TAX_RATE);
  }, [grandTotal]);

  const totalInclTax = React.useMemo(() => {
    return grandTotal + taxAmount;
  }, [grandTotal, taxAmount]);

  const mergedError = quoteError ?? orderError ?? payError;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Button
          className="mb-6"
          variant="outline"
          onClick={() => router.push("/top")}
        >
          ← 戻る
        </Button>
        <h1 className="text-2xl font-semibold mb-4 text-foreground">会計画面</h1>
        {customerName && (
          <p className="text-muted-foreground">
            顧客:{" "}
            <span className="font-semibold text-foreground">
              {customerName}
            </span>
          </p>
        )}
        {!customerName && customerId && (
          <p className="text-muted-foreground">顧客ID: {customerId}</p>
        )}
        <div className="mt-6 space-y-4">
          <PaymentFilters
            customerId={customerId}
            startDate={startDate}
            startTime={startTime}
            endDate={endDate}
            endTime={endTime}
            onChangeStartDate={setStartDate}
            onChangeStartTime={setStartTime}
            onChangeEndDate={setEndDate}
            onChangeEndTime={setEndTime}
            onRecalculate={refetch}
            loading={quoteLoading}
          />
          {mergedError && (
            <div className="text-destructive text-sm">{mergedError}</div>
          )}
          {quote && (
            <>
              <PaymentDetails quote={quote} orderSummary={orderSummary} />
              <PaymentActions
                grandTotal={grandTotal}
                taxAmount={taxAmount}
                totalInclTax={totalInclTax}
                payMethod={payMethod}
                onChangeMethod={setPayMethod}
                onPay={pay}
                isPaying={isPaying}
              />
            </>
          )}
          {!quote && (quoteLoading || orderLoading) && (
            <div className="text-sm text-muted-foreground">
              読み込み中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentPage: NextPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PaymentContent />
    </Suspense>
  );
};

export default PaymentPage;


