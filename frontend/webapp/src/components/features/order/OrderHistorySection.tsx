"use client";

import * as React from "react";
import type { OrderHistoryItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

type OrderHistorySectionProps = {
  orderHistory: OrderHistoryItem[];
  isLoading: boolean;
  error: string | null;
  cancelQty: Record<number, number>;
  onChangeCancelQty: (
    orderItemId: number,
    maxQty: number,
    value: string,
  ) => void;
  cancelSubmittingOrder: Record<number, boolean>;
  onSubmitCancel: (order: OrderHistoryItem) => Promise<void>;
};

export function OrderHistorySection({
  orderHistory,
  isLoading,
  error,
  cancelQty,
  onChangeCancelQty,
  cancelSubmittingOrder,
  onSubmitCancel,
}: OrderHistorySectionProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        履歴を読み込み中...
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (orderHistory.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        過去の注文はありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderHistory.map((order) => {
        const totalNum = Number(order.total_amount);
        const isNegative = !Number.isNaN(totalNum) && totalNum < 0;
        const created = new Date(order.created_at);
        const createdLabel = `${created.getFullYear()}/${String(
          created.getMonth() + 1,
        ).padStart(2, "0")}/${String(created.getDate()).padStart(
          2,
          "0",
        )} ${String(created.getHours()).padStart(2, "0")}:${String(
          created.getMinutes(),
        ).padStart(2, "0")}`;
        return (
          <div
            key={order.id}
            className="border border-border/50 rounded-md p-4 bg-card/60"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                注文日時:{" "}
                <span className="text-foreground font-medium">
                  {createdLabel}
                </span>
              </div>
              <div
                className={`text-sm font-semibold ${
                  isNegative ? "text-destructive" : "text-foreground"
                }`}
              >
                合計: {formatCurrency(String(Math.abs(totalNum)))}
                {isNegative && "（キャンセル）"}
              </div>
            </div>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {item.menu_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(String(item.menu_price))} ×{" "}
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-sm ${
                        item.quantity < 0
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {formatCurrency(
                        String(
                          item.menu_price * Math.abs(item.quantity),
                        ),
                      )}
                      {item.quantity < 0 && "（キャンセル）"}
                    </div>
                    {item.quantity > 0 && !isNegative && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={cancelQty[item.id] ?? 0}
                          onChange={(e) =>
                            onChangeCancelQty(
                              item.id,
                              item.quantity,
                              e.target.value,
                            )
                          }
                          className="w-16 border border-border/50 rounded px-1 py-0.5 text-xs bg-input/50 text-right"
                        />
                        <span className="text-xs text-muted-foreground">
                          個キャンセル
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {order.items.some((it) => it.quantity > 0) && !isNegative && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!cancelSubmittingOrder[order.id]}
                  onClick={() => {
                    void onSubmitCancel(order);
                  }}
                >
                  {cancelSubmittingOrder[order.id]
                    ? "キャンセル処理中..."
                    : "この注文のキャンセルを確定"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


