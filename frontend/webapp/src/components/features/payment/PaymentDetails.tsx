"use client";

import * as React from "react";
import type {
  CustomerQuoteResponse,
  PaymentSummaryResponse,
} from "@/lib/api";
import { formatCurrency, formatMinutes } from "@/lib/utils/format";

type PaymentDetailsProps = {
  quote: CustomerQuoteResponse;
  orderSummary: PaymentSummaryResponse | null;
};

export function PaymentDetails({
  quote,
  orderSummary,
}: PaymentDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="surface-elevated border border-border/50 rounded p-4">
        <h2 className="text-lg font-medium mb-2 text-foreground">注文内訳</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">商品</th>
                <th className="py-2 pr-4">数量</th>
                <th className="py-2 pr-4">小計</th>
              </tr>
            </thead>
            <tbody>
              {orderSummary?.items.map((row) => (
                <tr
                  key={row.menu_id}
                  className="border-b border-border/30 last:border-b-0"
                >
                  <td className="py-2 pr-4 text-foreground">
                    {row.menu_name}
                  </td>
                  <td className="py-2 pr-4 text-foreground">
                    {row.quantity}
                  </td>
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {formatCurrency(row.line_total)}
                  </td>
                </tr>
              ))}
              {(orderSummary?.items.length ?? 0) === 0 && (
                <tr>
                  <td
                    className="py-3 text-muted-foreground"
                    colSpan={3}
                  >
                    注文はありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-right text-sm text-muted-foreground">
          注文小計:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(orderSummary?.order_total ?? "0")}
          </span>
        </div>
      </div>

      <div className="surface-elevated border border-border/50 rounded p-4">
        <h2 className="text-lg font-medium mb-2 text-foreground">
          時間料金内訳
        </h2>
        <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">実プレイ時間</div>
          <div className="text-foreground">
            {formatMinutes(quote.played_minutes)}
          </div>
          <div className="text-muted-foreground">時間料金小計</div>
          <div className="font-semibold text-foreground">
            {formatCurrency(quote.subtotal)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">刻み（分）</th>
                <th className="py-2 pr-4">適用回数</th>
                <th className="py-2 pr-4">単価</th>
                <th className="py-2 pr-4">小計</th>
              </tr>
            </thead>
            <tbody>
              {quote.breakdown.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/30 last:border-b-0"
                >
                  <td className="py-2 pr-4 text-foreground">
                    {formatMinutes(row.minutes)}
                  </td>
                  <td className="py-2 pr-4 text-foreground">
                    {row.count}
                  </td>
                  <td className="py-2 pr-4 text-foreground">
                    {formatCurrency(row.unit_price)}
                  </td>
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {formatCurrency(row.line_total)}
                  </td>
                </tr>
              ))}
              {quote.breakdown.length === 0 && (
                <tr>
                  <td
                    className="py-3 text-muted-foreground"
                    colSpan={4}
                  >
                    内訳はありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


