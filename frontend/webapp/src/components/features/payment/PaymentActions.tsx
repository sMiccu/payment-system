"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import type { PaymentMethod } from "@/lib/api";

type PaymentActionsProps = {
  grandTotal: number;
  taxAmount: number;
  totalInclTax: number;
  payMethod: PaymentMethod | null;
  onChangeMethod: (method: PaymentMethod) => void;
  onPay: () => Promise<void>;
  isPaying: boolean;
};

export function PaymentActions({
  grandTotal,
  taxAmount,
  totalInclTax,
  payMethod,
  onChangeMethod,
  onPay,
  isPaying,
}: PaymentActionsProps) {
  const handlePay = React.useCallback(() => {
    void onPay();
  }, [onPay]);

  return (
    <div className="surface-elevated border border-border/50 rounded p-4">
      <h2 className="text-lg font-medium mb-2 text-foreground">会計</h2>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="payment_method"
            value="cash"
            checked={payMethod === "cash"}
            onChange={() => onChangeMethod("cash")}
          />
          現金
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="payment_method"
            value="paypay"
            checked={payMethod === "paypay"}
            onChange={() => onChangeMethod("paypay")}
          />
          PayPay
        </label>
        <div className="ml-auto text-lg text-foreground">
          合計:{" "}
          <span className="font-semibold">
            {formatCurrency(String(grandTotal))}
          </span>
        </div>
      </div>
      <div className="mt-2 text-right space-y-0.5">
        <div className="text-sm text-muted-foreground">
          消費税（10%）:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(String(taxAmount))}
          </span>
        </div>
        <div className="text-lg text-foreground">
          税込金額:{" "}
          <span className="font-semibold">
            {formatCurrency(String(totalInclTax))}
          </span>
        </div>
      </div>
      <Button
        className="mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        disabled={!payMethod || isPaying}
        onClick={handlePay}
      >
        {isPaying ? "会計処理中..." : "会計"}
      </Button>
    </div>
  );
}


