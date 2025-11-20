"use client";

import type { NextPage } from "next";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { fetchCustomerQuote, type CustomerQuoteResponse } from "@/lib/api";

const PaymentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [data, setData] = useState<CustomerQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDt, setStartDt] = useState<string>("");
  const [endDt, setEndDt] = useState<string>("");

  const fetchQuote = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomerQuote(customerId, {
        start_dt: startDt || undefined,
        end_dt: endDt || undefined,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "見積取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [customerId, startDt, endDt]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const formatCurrency = useCallback((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) return s;
    return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  }, []);

  const formatMinutes = useCallback((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) return `${s}分`;
    // 少数分がある場合は最大2桁表示
    return `${n.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}分`;
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
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
            <h1 className="text-2xl font-semibold mb-4">会計画面</h1>
            {customerId && (
              <p className="text-gray-600">顧客ID: {customerId}</p>
            )}
            <div className="mt-6 space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">開始時刻（ISO8601 任意）</label>
                  <input
                    className="border rounded px-3 py-2 w-72"
                    placeholder="例: 2025-11-19T10:00:00+09:00"
                    value={startDt}
                    onChange={(e) => setStartDt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">終了時刻（ISO8601 任意）</label>
                  <input
                    className="border rounded px-3 py-2 w-72"
                    placeholder="例: 2025-11-19T12:34:56+09:00"
                    value={endDt}
                    onChange={(e) => setEndDt(e.target.value)}
                  />
                </div>
                <Button onClick={fetchQuote} disabled={!customerId || loading}>
                  {loading ? "更新中..." : "再計算"}
                </Button>
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              {data && (
                <div className="space-y-6">
                  <div className="bg-white border rounded p-4">
                    <h2 className="text-lg font-medium mb-2">サマリ</h2>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-gray-600">実プレイ時間</div>
                      <div>{formatMinutes(data.played_minutes)}</div>
                      <div className="text-gray-600">小計</div>
                      <div className="font-semibold">{formatCurrency(data.subtotal)}</div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>

                  <div className="bg-white border rounded p-4">
                    <h2 className="text-lg font-medium mb-2">料金内訳</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="py-2 pr-4">刻み（分）</th>
                            <th className="py-2 pr-4">回数</th>
                            <th className="py-2 pr-4">単価</th>
                            <th className="py-2 pr-4">小計</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.breakdown.map((row, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="py-2 pr-4">{formatMinutes(row.minutes)}</td>
                              <td className="py-2 pr-4">{row.count}</td>
                              <td className="py-2 pr-4">{formatCurrency(row.unit_price)}</td>
                              <td className="py-2 pr-4 font-medium">{formatCurrency(row.line_total)}</td>
                            </tr>
                          ))}
                          {data.breakdown.length === 0 && (
                            <tr>
                              <td className="py-3 text-gray-500" colSpan={4}>内訳はありません</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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

