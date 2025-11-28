"use client";

import type { NextPage } from "next";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  fetchMenus,
  type MenuItem,
  createOrder,
  fetchOrderHistory,
  cancelOrderItems,
  type OrderHistoryItem,
} from "@/lib/api";

const OrderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const customerName = searchParams.get("customerName");
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  type CartLine = { menu: MenuItem; quantity: number };
  const [cart, setCart] = useState<Record<number, CartLine>>({});

  // 注文履歴とキャンセルUI用の状態
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [cancelQty, setCancelQty] = useState<Record<number, number>>({});
  const [cancelSubmittingOrder, setCancelSubmittingOrder] = useState<Record<number, boolean>>({});

  const groupedByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    menus.forEach((m) => {
      const key = m.category_name || "未分類";
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], "ja"));
  }, [menus]);

  const addToCart = useCallback((menu: MenuItem) => {
    setCart((prev) => {
      const current = prev[menu.id];
      const quantity = (current?.quantity ?? 0) + 1;
      return { ...prev, [menu.id]: { menu, quantity } };
    });
  }, []);

  const changeQty = useCallback((menuId: number, delta: number) => {
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

  const removeLine = useCallback((menuId: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[menuId];
      return next;
    });
  }, []);

  const total = useMemo(() => {
    return Object.values(cart).reduce((sum, line) => sum + line.menu.price * line.quantity, 0);
  }, [cart]);

  const formatJPY = useCallback((n: number) => {
    return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  }, []);

  const fetchAllMenus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMenus();
      setMenus(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "メニューの取得に失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMenus();
  }, [fetchAllMenus]);

  const loadHistory = useCallback(async () => {
    if (!customerId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetchOrderHistory(customerId);
      setOrderHistory(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "注文履歴の取得に失敗しました";
      setHistoryError(msg);
    } finally {
      setHistoryLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const canSubmit = useMemo(() => Object.keys(cart).length > 0 && !!customerId && !submitting, [cart, customerId, submitting]);

  const onSubmit = useCallback(async () => {
    if (!customerId) {
      setError("顧客IDが指定されていません。");
      return;
    }
    const items = Object.values(cart).map((line) => ({ menu_id: line.menu.id, quantity: line.quantity }));
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await createOrder({ customer_id: Number(customerId), items });
      setCart({});
      // 新しい注文を履歴に反映
      await loadHistory();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "注文の作成に失敗しました";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [cart, customerId, loadHistory]);

  const handleChangeCancelQty = useCallback(
    (orderItemId: number, maxQty: number, value: string) => {
      let num = Number(value);
      if (Number.isNaN(num) || num < 0) num = 0;
      if (num > maxQty) num = maxQty;
      setCancelQty((prev) => ({ ...prev, [orderItemId]: num }));
    },
    [],
  );

  const handleSubmitCancel = useCallback(
    async (order: OrderHistoryItem) => {
      const itemsPayload = order.items
        .filter((it) => it.quantity > 0)
        .map((it) => {
          const q = cancelQty[it.id] ?? 0;
          return q > 0 ? { order_item_id: it.id, cancel_quantity: q } : null;
        })
        .filter(
          (v): v is { order_item_id: number; cancel_quantity: number } => v !== null,
        );

      if (itemsPayload.length === 0) {
        alert("キャンセルする数量を1以上に設定してください。");
        return;
      }

      const totalCancel = itemsPayload.reduce((sum, v) => sum + v.cancel_quantity, 0);
      const confirmed = window.confirm(
        `この注文から合計 ${totalCancel} 個をキャンセルしますか？\nキャンセル用のマイナス注文が新たに作成されます。`,
      );
      if (!confirmed) return;

      setCancelSubmittingOrder((prev) => ({ ...prev, [order.id]: true }));
      try {
        await cancelOrderItems(order.id, itemsPayload);
        // この注文のキャンセル入力をクリア
        setCancelQty((prev) => {
          const next = { ...prev };
          order.items.forEach((it) => {
            delete next[it.id];
          });
          return next;
        });
        await loadHistory();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "キャンセル処理に失敗しました";
        setHistoryError(msg);
      } finally {
        setCancelSubmittingOrder((prev) => ({ ...prev, [order.id]: false }));
      }
    },
    [cancelQty, loadHistory],
  );

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
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
                顧客: <span className="font-semibold text-foreground">{customerName}</span>
              </p>
            )}
            {!customerName && customerId && (
              <p className="text-muted-foreground">顧客ID: {customerId}</p>
            )}
            {error && <div className="text-destructive text-sm mb-3">{error}</div>}

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground">読み込み中...</div>
                ) : (
                  groupedByCategory.map(([category, list]) => (
                    <div key={category} className="surface-elevated border border-border/50 rounded p-4">
                      <h2 className="text-lg font-medium mb-2 text-foreground">{category}</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {list.map((m) => (
                          <div key={m.id} className="border border-border/30 bg-card/30 rounded p-3 flex items-center justify-between hover:border-primary/30 transition-all">
                            <div>
                              <div className="font-medium text-foreground">{m.name}</div>
                              <div className="text-sm text-muted-foreground">{formatJPY(m.price)}</div>
                            </div>
                            <Button size="sm" onClick={() => addToCart(m)}>追加</Button>
                          </div>
                        ))}
                        {list.length === 0 && <div className="text-sm text-muted-foreground">商品がありません</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="col-span-1">
                <div className="surface-elevated border border-border/50 rounded p-4 sticky top-4">
                  <h2 className="text-lg font-medium mb-3 text-foreground">選択商品</h2>
                  <div className="space-y-3">
                    {Object.values(cart).map((line) => (
                      <div key={line.menu.id} className="flex items-center justify-between border-b border-border/30 pb-2">
                        <div>
                          <div className="font-medium text-foreground">{line.menu.name}</div>
                          <div className="text-sm text-muted-foreground">{formatJPY(line.menu.price)} × {line.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => changeQty(line.menu.id, -1)}>-</Button>
                          <span className="w-6 text-center text-foreground">{line.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => changeQty(line.menu.id, +1)}>+</Button>
                          <Button size="sm" variant="destructive" onClick={() => removeLine(line.menu.id)}>削除</Button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(cart).length === 0 && (
                      <div className="text-sm text-muted-foreground">商品が選択されていません</div>
                    )}
                  </div>
                  <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
                    <div className="text-muted-foreground">小計</div>
                    <div className="text-lg font-semibold text-foreground">{formatJPY(total)}</div>
                  </div>
                  <Button className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={!canSubmit} onClick={onSubmit}>
                    {submitting ? "送信中..." : "注文確定"}
                  </Button>
                </div>
              </div>
            </div>

            {/* 注文履歴 */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-3 text-foreground">注文履歴</h2>
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">履歴を読み込み中...</div>
              ) : historyError ? (
                <div className="text-sm text-destructive">{historyError}</div>
              ) : orderHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">過去の注文はありません</div>
              ) : (
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
                            合計:{" "}
                            {formatJPY(Math.abs(totalNum))}
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
                                  {formatJPY(item.menu_price)} × {item.quantity}
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
                                  {formatJPY(
                                    item.menu_price * Math.abs(item.quantity),
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
                                        handleChangeCancelQty(
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
                              disabled={cancelSubmittingOrder[order.id]}
                              onClick={() => handleSubmitCancel(order)}
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
              )}
            </div>
          </div>
        </div>
      </main>
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

