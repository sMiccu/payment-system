"use client";

import type { NextPage } from "next";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { fetchMenus, type MenuItem, createOrder } from "@/lib/api";

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
      router.push("/top");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "注文の作成に失敗しました";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [cart, customerId, router]);

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

