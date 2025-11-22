"use client";

import type { NextPage } from "next";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { fetchCustomerQuote, type CustomerQuoteResponse, fetchCustomerPaymentSummary, type PaymentSummaryResponse, payCustomer, type PaymentMethod } from "@/lib/api";

const TAX_RATE = 0.1;

const PaymentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const customerName = searchParams.get("customerName");
  const [data, setData] = useState<CustomerQuoteResponse | null>(null);
  const [orderSummary, setOrderSummary] = useState<PaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 日付と時間を別々に保持（ユーザーはdate/time入力、APIにはISO8601で渡す）
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [payMethod, setPayMethod] = useState<PaymentMethod | null>(null);
  const [paying, setPaying] = useState(false);

  // date + time からISO8601文字列を生成（両方そろっていない場合はundefined）
  const buildIso = (dateStr: string, timeStr: string): string | undefined => {
    if (!dateStr || !timeStr) return undefined;
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return undefined;
    const d = new Date(year, month - 1, day, hour, minute, 0);
    return d.toISOString();
  };

  const fetchQuote = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const startDt = buildIso(startDate, startTime);
      const endDt = buildIso(endDate, endTime);
      const res = await fetchCustomerQuote(customerId, {
        start_dt: startDt || undefined,
        end_dt: endDt || undefined,
      });
      setData(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "見積取得に失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [customerId, startDate, startTime, endDate, endTime]);

  const fetchOrders = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await fetchCustomerPaymentSummary(customerId);
      setOrderSummary(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "注文内訳の取得に失敗しました";
      setError(msg);
    }
  }, [customerId]);

  useEffect(() => {
    // デフォルトで本日の日付をセット
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const dd = today.getDate().toString().padStart(2, "0");
    setStartDate(`${yyyy}-${mm}-${dd}`);
    setEndDate(`${yyyy}-${mm}-${dd}`);

    fetchQuote();
    fetchOrders();
  }, [fetchQuote, fetchOrders]);

  const formatCurrency = useCallback((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) return s;
    return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  }, []);

  const formatMinutes = useCallback((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) return `${s}分`;
    const totalMinutes = Math.floor(n);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.round((n - totalMinutes) * 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}時間`);
    if (minutes > 0) parts.push(`${minutes}分`);
    if (seconds > 0 && hours === 0) {
      // 分単位メインなので、秒はおまけ的に。長時間の場合は省略。
      parts.push(`${seconds}秒`);
    }
    if (parts.length === 0) return "0分";
    return parts.join("");
  }, []);

  const toNumber = (s?: string | null) => {
    if (!s) return 0;
    const n = Number(s);
    return Number.isNaN(n) ? 0 : n;
  };
  const grandTotal = useMemo(() => {
    const quoteSubtotal = toNumber(data?.subtotal ?? "0");
    const orderTotal = toNumber(orderSummary?.order_total ?? "0");
    return quoteSubtotal + orderTotal;
  }, [data, orderSummary]);

  const taxAmount = useMemo(() => {
    return Math.floor(grandTotal * TAX_RATE);
  }, [grandTotal]);

  const totalInclTax = useMemo(() => {
    return grandTotal + taxAmount;
  }, [grandTotal, taxAmount]);

  const onPay = useCallback(async () => {
    if (!customerId || !payMethod) return;
    setPaying(true);
    setError(null);
    try {
      await payCustomer({ customer_id: Number(customerId), payment_method: payMethod });
      router.push("/top");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "会計処理に失敗しました";
      setError(msg);
    } finally {
      setPaying(false);
    }
  }, [customerId, payMethod, router]);

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
            <h1 className="text-2xl font-semibold mb-4 text-foreground">会計画面</h1>
            {customerName && (
              <p className="text-muted-foreground">
                顧客: <span className="font-semibold text-foreground">{customerName}</span>
              </p>
            )}
            {!customerName && customerId && (
              <p className="text-muted-foreground">顧客ID: {customerId}</p>
            )}
            <div className="mt-6 space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-muted-foreground">開始日 / 開始時刻（任意）</label>
                  <input
                    className="border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-72"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    className="mt-2 border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-40"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-muted-foreground">終了日 / 終了時刻（任意）</label>
                  <input
                    className="border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-72"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <input
                    className="mt-2 border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-40"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <Button onClick={fetchQuote} disabled={!customerId || loading}>
                  {loading ? "更新中..." : "再計算"}
                </Button>
              </div>
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
              {data && (
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
                            <tr key={row.menu_id} className="border-b border-border/30 last:border-b-0">
                              <td className="py-2 pr-4 text-foreground">{row.menu_name}</td>
                              <td className="py-2 pr-4 text-foreground">{row.quantity}</td>
                              <td className="py-2 pr-4 font-medium text-foreground">{formatCurrency(row.line_total)}</td>
                            </tr>
                          ))}
                          {(orderSummary?.items.length ?? 0) === 0 && (
                            <tr>
                              <td className="py-3 text-muted-foreground" colSpan={3}>注文はありません</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-right text-sm text-muted-foreground">
                      注文小計: <span className="font-medium text-foreground">{formatCurrency(orderSummary?.order_total ?? "0")}</span>
                    </div>
                  </div>

                  <div className="surface-elevated border border-border/50 rounded p-4">
                    <h2 className="text-lg font-medium mb-2 text-foreground">時間料金内訳</h2>
                    <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">実プレイ時間</div>
                      <div className="text-foreground">{formatMinutes(data.played_minutes)}</div>
                      <div className="text-muted-foreground">時間料金小計</div>
                      <div className="font-semibold text-foreground">{formatCurrency(data.subtotal)}</div>
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
                          {data.breakdown.map((row, idx) => (
                            <tr key={idx} className="border-b border-border/30 last:border-b-0">
                              <td className="py-2 pr-4 text-foreground">{formatMinutes(row.minutes)}</td>
                              <td className="py-2 pr-4 text-foreground">{row.count}</td>
                              <td className="py-2 pr-4 text-foreground">{formatCurrency(row.unit_price)}</td>
                              <td className="py-2 pr-4 font-medium text-foreground">{formatCurrency(row.line_total)}</td>
                            </tr>
                          ))}
                          {data.breakdown.length === 0 && (
                            <tr>
                              <td className="py-3 text-muted-foreground" colSpan={4}>内訳はありません</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="surface-elevated border border-border/50 rounded p-4">
                    <h2 className="text-lg font-medium mb-2 text-foreground">会計</h2>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="radio"
                          name="payment_method"
                          value="cash"
                          checked={payMethod === "cash"}
                          onChange={() => setPayMethod("cash")}
                        />
                        現金
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="radio"
                          name="payment_method"
                          value="paypay"
                          checked={payMethod === "paypay"}
                          onChange={() => setPayMethod("paypay")}
                        />
                        PayPay
                      </label>
                      <div className="ml-auto text-lg text-foreground">
                        合計: <span className="font-semibold">{formatCurrency(String(grandTotal))}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-right space-y-0.5">
                      <div className="text-sm text-muted-foreground">
                        消費税（10%）: <span className="font-medium text-foreground">{formatCurrency(String(taxAmount))}</span>
                      </div>
                      <div className="text-lg text-foreground">
                        税込金額: <span className="font-semibold">{formatCurrency(String(totalInclTax))}</span>
                      </div>
                    </div>
                    <Button className="mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={!payMethod || paying} onClick={onPay}>
                      {paying ? "会計処理中..." : "会計"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
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

