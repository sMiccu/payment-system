 "use client";
 
import type { NextPage } from "next";
import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { MenuItem, OrderHistoryItem } from "@/lib/api";
import { useMenus } from "@/features/order/api/useMenus";
import { useOrderHistory } from "@/features/order/api/useOrderHistory";
import { useCreateOrder } from "@/features/order/api/useCreateOrder";
import { MenuList } from "@/components/features/order/MenuList";
import {
  CartSummary,
  type CartLine,
} from "@/components/features/order/CartSummary";
import { OrderHistorySection } from "@/components/features/order/OrderHistorySection";
import { useToast } from "@/components/layout/ToastProvider";

const OrderContent = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const customerName = searchParams.get("customerName");

  const { menus, isLoading: menusLoading, error: menusError } = useMenus();
  const {
    orderHistory,
    isLoading: historyLoading,
    error: historyError,
    reload: reloadHistory,
  } = useOrderHistory(customerId);

  const {
    create,
    isSubmitting,
    error: createError,
  } = useCreateOrder({
    customerId,
    onSuccess: async () => {
      setCart({});
      await reloadHistory();
    },
  });

  const [error, setError] = React.useState<string | null>(null);

  const [cart, setCart] = React.useState<Record<number, CartLine>>({});

  // 注文履歴キャンセル用
  const [cancelQty, setCancelQty] = React.useState<Record<number, number>>({});
  const [cancelSubmittingOrder, setCancelSubmittingOrder] = React.useState<
    Record<number, boolean>
  >({});

  const addToCart = React.useCallback((menu: MenuItem) => {
    setCart((prev) => {
      const current = prev[menu.id];
      const quantity = (current?.quantity ?? 0) + 1;
      return { ...prev, [menu.id]: { menu, quantity } };
    });
  }, []);

  const changeQty = React.useCallback((menuId: number, delta: number) => {
    setCart((prev) => {
      const line = prev[menuId];
      if (!line) return prev;
      const nextQty = line.quantity + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[menuId];
        return next;
      }
      return { ...prev, [menuId]: { ...line, quantity: nextQty } };
    });
  }, []);

  const removeLine = React.useCallback((menuId: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[menuId];
      return next;
    });
  }, []);

  const total = React.useMemo(() => {
    return Object.values(cart).reduce(
      (sum, line) => sum + line.menu.price * line.quantity,
      0,
    );
  }, [cart]);

  const canSubmit = React.useMemo(
    () => Object.keys(cart).length > 0 && !!customerId && !isSubmitting,
    [cart, customerId, isSubmitting],
  );

  const handleSubmitOrder = React.useCallback(async () => {
    if (!customerId) {
      setError("顧客IDが指定されていません。");
      return;
    }
    const items = Object.values(cart).map((line) => ({
      menu_id: line.menu.id,
      quantity: line.quantity,
    }));
    await create(items);
  }, [cart, create, customerId]);

  const handleChangeCancelQty = React.useCallback(
    (orderItemId: number, maxQty: number, value: string) => {
      let num = Number(value);
      if (Number.isNaN(num) || num < 0) num = 0;
      if (num > maxQty) num = maxQty;
      setCancelQty((prev) => ({ ...prev, [orderItemId]: num }));
    },
    [],
  );

  const handleSubmitCancel = React.useCallback(
    async (order: OrderHistoryItem) => {
      const itemsPayload = order.items
        .filter((it) => it.quantity > 0)
        .map((it) => {
          const q = cancelQty[it.id] ?? 0;
          return q > 0
            ? { order_item_id: it.id, cancel_quantity: q }
            : null;
        })
        .filter(
          (
            v,
          ): v is { order_item_id: number; cancel_quantity: number } =>
            v !== null,
        );

      if (itemsPayload.length === 0) {
        showToast("キャンセルする数量を1以上に設定してください。", "error");
        return;
      }

      const totalCancel = itemsPayload.reduce(
        (sum, v) => sum + v.cancel_quantity,
        0,
      );
      const confirmed = window.confirm(
        `この注文から合計 ${totalCancel} 個をキャンセルしますか？\nキャンセル用のマイナス注文が新たに作成されます。`,
      );
      if (!confirmed) return;

      setCancelSubmittingOrder((prev) => ({ ...prev, [order.id]: true }));
      try {
        // 既存APIを直接利用
        const { cancelOrderItems } = await import("@/lib/api");
        await cancelOrderItems(order.id, itemsPayload);
        // この注文のキャンセル入力をクリア
        setCancelQty((prev) => {
          const next = { ...prev };
          order.items.forEach((it) => {
            delete next[it.id];
          });
          return next;
        });
        await reloadHistory();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "キャンセル処理に失敗しました";
        console.error("Failed to cancel order items:", e);
        showToast(msg, "error");
      } finally {
        setCancelSubmittingOrder((prev) => ({ ...prev, [order.id]: false }));
      }
    },
    [cancelQty, reloadHistory],
  );

  const mergedError = error ?? createError;

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
        <h1 className="text-2xl font-semibold mb-4 text-foreground">注文画面</h1>
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
        {mergedError && (
          <div className="text-destructive text-sm mb-3">{mergedError}</div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <MenuList
              menus={menus}
              isLoading={menusLoading}
              error={menusError}
              onAddToCart={addToCart}
            />
          </div>

          <CartSummary
            cart={cart}
            total={total}
            canSubmit={canSubmit}
            submitting={isSubmitting}
            onChangeQty={changeQty}
            onRemoveLine={removeLine}
            onSubmit={handleSubmitOrder}
          />
        </div>

        {/* 注文履歴 */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-3 text-foreground">注文履歴</h2>
          <OrderHistorySection
            orderHistory={orderHistory}
            isLoading={historyLoading}
            error={historyError}
            cancelQty={cancelQty}
            onChangeCancelQty={handleChangeCancelQty}
            cancelSubmittingOrder={cancelSubmittingOrder}
            onSubmitCancel={handleSubmitCancel}
          />
        </div>
      </div>
    </div>
  );
};

const OrderPage: NextPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <OrderContent />
    </Suspense>
  );
};

export default OrderPage;


