"use client";

import * as React from "react";
import type { MenuItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export type CartLine = {
  menu: MenuItem;
  quantity: number;
};

type CartSummaryProps = {
  cart: Record<number, CartLine>;
  total: number;
  canSubmit: boolean;
  submitting: boolean;
  onChangeQty: (menuId: number, delta: number) => void;
  onRemoveLine: (menuId: number) => void;
  onSubmit: () => Promise<void>;
};

export function CartSummary({
  cart,
  total,
  canSubmit,
  submitting,
  onChangeQty,
  onRemoveLine,
  onSubmit,
}: CartSummaryProps) {
  const handleSubmit = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      void onSubmit();
    },
    [onSubmit],
  );

  const lines = Object.values(cart);

  return (
    <div className="col-span-1">
      <div className="surface-elevated border border-border/50 rounded p-4 sticky top-4">
        <h2 className="text-lg font-medium mb-3 text-foreground">選択商品</h2>
        <div className="space-y-3">
          {lines.map((line) => (
            <div
              key={line.menu.id}
              className="flex items-center justify-between border-b border-border/30 pb-2"
            >
              <div>
                <div className="font-medium text-foreground">
                  {line.menu.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(String(line.menu.price))} × {line.quantity}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChangeQty(line.menu.id, -1)}
                >
                  -
                </Button>
                <span className="w-6 text-center text-foreground">
                  {line.quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChangeQty(line.menu.id, +1)}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemoveLine(line.menu.id)}
                >
                  削除
                </Button>
              </div>
            </div>
          ))}
          {lines.length === 0 && (
            <div className="text-sm text-muted-foreground">
              商品が選択されていません
            </div>
          )}
        </div>
        <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
          <div className="text-muted-foreground">小計</div>
          <div className="text-lg font-semibold text-foreground">
            {formatCurrency(String(total))}
          </div>
        </div>
        <Button
          className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          disabled={!canSubmit || lines.length === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "送信中..." : "注文確定"}
        </Button>
      </div>
    </div>
  );
}


