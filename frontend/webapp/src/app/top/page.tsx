"use client";

import type { NextPage } from "next";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

// APIから取得する顧客データの型定義
type CustomerApiResponse = {
  id: number;
  name: string;
  start_datetime: string | null;
  end_datetime: string | null;
  total_amount: string;
  paid: boolean;
  membership: number | null;
  is_breaking: boolean;
};

type CustomerBreak = {
  id: number;
  start_datetime: string | null;
  end_datetime: string | null;
};

// 表示用の顧客データの型定義
type Customer = {
  id: string;
  name: string;
  startTime: string;
  isBreaking: boolean;
  startDatetime: string | null;
  endDatetime: string | null;
};

// start_datetimeから時刻を抽出する関数
const extractTime = (datetime: string | null): string => {
  if (!datetime) return "--:--";
  const date = new Date(datetime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const Page: NextPage = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [breaksMap, setBreaksMap] = useState<Record<string, CustomerBreak[]>>({});
  const [breaksLoading, setBreaksLoading] = useState<Record<string, boolean>>({});
  const [breaksError, setBreaksError] = useState<Record<string, string | null>>({});

  const toggleBreak = async (customerId: string, isBreaking: boolean) => {
    try {
      setError(null);
      if (isBreaking) {
        await apiFetch(`/customer/api/customer/${customerId}/resume/`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      } else {
        await apiFetch(`/customer/api/customer/${customerId}/pause/`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      }
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, isBreaking: !isBreaking } : c
        )
      );
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setError(`休止/再開の操作に失敗しました: ${errorMessage}`);
      console.error("Failed to toggle break:", e);
    }
  };

  const toggleExpand = async (customerId: string) => {
    const next = !expanded[customerId];
    setExpanded((prev) => ({ ...prev, [customerId]: next }));
    if (next && !breaksMap[customerId] && !breaksLoading[customerId]) {
      setBreaksLoading((prev) => ({ ...prev, [customerId]: true }));
      setBreaksError((prev) => ({ ...prev, [customerId]: null }));
      try {
        const items = await apiFetch<CustomerBreak[]>(
          `/customer/api/customer_break/?customer=${customerId}`
        );
        setBreaksMap((prev) => ({ ...prev, [customerId]: items }));
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "不明なエラーが発生しました";
        setBreaksError((prev) => ({
          ...prev,
          [customerId]: `休止履歴の取得に失敗しました: ${errorMessage}`,
        }));
      } finally {
        setBreaksLoading((prev) => ({ ...prev, [customerId]: false }));
      }
    }
  };

  const formatDateTime = (datetime: string | null): string => {
    if (!datetime) return "--/-- --:--";
    const d = new Date(datetime);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const mi = d.getMinutes().toString().padStart(2, "0");
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
  };

  const formatMs = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const calcTotals = (customer: Customer, breaks: CustomerBreak[]) => {
    const now = new Date();
    const start = customer.startDatetime ? new Date(customer.startDatetime) : null;
    const end = customer.endDatetime ? new Date(customer.endDatetime) : null;
    let totalStopMs = 0;
    for (const b of breaks) {
      if (!b.start_datetime) continue;
      const bs = new Date(b.start_datetime);
      const be = b.end_datetime ? new Date(b.end_datetime) : now;
      if (end && be > end) {
        // 過剰分は切り詰め
        totalStopMs += Math.max(0, Math.min(end.getTime(), be.getTime()) - bs.getTime());
      } else {
        totalStopMs += Math.max(0, be.getTime() - bs.getTime());
      }
    }
    let totalPlayMs = 0;
    if (start) {
      const playEnd = end ?? now;
      totalPlayMs = Math.max(0, playEnd.getTime() - start.getTime() - totalStopMs);
    }
    return { totalPlayMs, totalStopMs };
  };
  
  type PlaySegment = {
    leftLabel: "開始" | "再開";
    left: Date;
    rightLabel: "停止" | "現在" | "会計";
    right: Date;
  };
  
  const getPlaySegments = (customer: Customer, breaks: CustomerBreak[]): PlaySegment[] => {
    const segments: PlaySegment[] = [];
    if (!customer.startDatetime) return segments;
    const startAt = new Date(customer.startDatetime);
    const endAt = customer.endDatetime ? new Date(customer.endDatetime) : null;
    const sorted = [...breaks].filter(b => !!b.start_datetime).sort((a, b) => {
      return new Date(a.start_datetime as string).getTime() - new Date(b.start_datetime as string).getTime();
    });
    let currentStart: Date | null = startAt;
    for (let i = 0; i < sorted.length; i++) {
      const b = sorted[i];
      const breakStart = new Date(b.start_datetime as string);
      if (endAt && breakStart.getTime() >= endAt.getTime()) {
        // 会計が先に来る場合、ここで終了
        if (currentStart) {
          segments.push({
            leftLabel: segments.length === 0 ? "開始" : "再開",
            left: currentStart,
            rightLabel: "会計",
            right: endAt,
          });
        }
        return segments;
      }
      if (currentStart && breakStart.getTime() > currentStart.getTime()) {
        segments.push({
          leftLabel: segments.length === 0 ? "開始" : "再開",
          left: currentStart,
          rightLabel: "停止",
          right: breakStart,
        });
      }
      // 次のプレイ開始はこのブレークの終了（再開時刻）
      if (b.end_datetime) {
        currentStart = new Date(b.end_datetime);
      } else {
        // 休止中なので次のプレイ開始は未定
        currentStart = null;
      }
    }
    // ループ後、まだプレイ継続の区間があれば追加
    if (currentStart) {
      const right = endAt ?? new Date();
      segments.push({
        leftLabel: segments.length === 0 ? "開始" : "再開",
        left: currentStart,
        rightLabel: endAt ? "会計" : "現在",
        right,
      });
    }
    return segments;
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // APIから顧客データを取得
        const data: CustomerApiResponse[] = await apiFetch<CustomerApiResponse[]>(
          "/customer/api/customer/"
        );
        
        // 来店中の顧客のみをフィルタリング（end_datetimeがnullのもの）
        const activeCustomers = data.filter(
          (customer) => customer.end_datetime === null
        );
        
        // 表示用の形式に変換
        const formattedCustomers: Customer[] = activeCustomers.map(
          (customer) => ({
            id: customer.id.toString(),
            name: customer.name,
            startTime: extractTime(customer.start_datetime),
            isBreaking: customer.is_breaking,
            startDatetime: customer.start_datetime,
            endDatetime: customer.end_datetime,
          })
        );
        
        setCustomers(formattedCustomers);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "不明なエラーが発生しました";
        setError(`顧客データの取得に失敗しました: ${errorMessage}`);
        console.error("Failed to fetch customers:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* 来店登録ボタン */}
          <div className="mb-8">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-base px-8 py-6 h-auto shadow-md"
              size="lg"
              onClick={() => router.push("/customer-register")}
            >
              来店登録
            </Button>
          </div>

          {/* 顧客リスト */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">来店中のお客様</h2>
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">
                読み込み中...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                {error}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                来店中の顧客はいません
              </div>
            ) : (
              customers.map((customer) => (
                <div key={customer.id}>
                  <div
                    className="bg-gray-100 rounded-lg p-4 flex items-center justify-between shadow-sm mb-3"
                  >
                    <div className="flex-1 flex items-center font-medium text-gray-800">
                      <button
                        className="mr-3 text-gray-600 hover:text-gray-800 transition"
                        onClick={() => toggleExpand(customer.id)}
                        aria-label="詳細を展開"
                        title="詳細を展開"
                      >
                        {expanded[customer.id] ? "▲" : "▼"}
                      </button>
                      <span>{customer.name}</span>
                    </div>
                    <div className="flex-1 text-gray-600">開始: {customer.startTime}</div>
                    <div className="flex items-center space-x-4">
                      <Button
                        className="bg-gray-300 hover:bg-gray-400 text-black font-medium rounded-lg px-6 border border-gray-200"
                        onClick={() => toggleBreak(customer.id, customer.isBreaking)}
                      >
                        {customer.isBreaking ? "再開" : "停止"}
                      </Button>
                      <Button
                        className="bg-green-400 hover:bg-green-500 text-black font-medium rounded-lg px-6 border border-gray-200"
                        onClick={() => router.push(`/order?customerId=${customer.id}`)}
                      >
                        注文
                      </Button>
                      <Button
                        className="bg-red-300 hover:bg-red-400 text-white font-medium rounded-lg px-6 border border-gray-200"
                        disabled={!customer.isBreaking}
                        onClick={() => router.push(`/payment?customerId=${customer.id}`)}
                      >
                        会計
                      </Button>
                    </div>
                  </div>
                  {expanded[customer.id] && (
                    <div className="bg-white rounded-md p-4 border border-gray-200 mb-3">
                      {breaksLoading[customer.id] ? (
                        <div className="text-gray-600">履歴を読み込み中...</div>
                      ) : breaksError[customer.id] ? (
                        <div className="text-red-600">{breaksError[customer.id]}</div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <div className="font-semibold text-gray-800 mb-2">履歴</div>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {getPlaySegments(customer, breaksMap[customer.id] ?? []).map((seg, idx) => (
                              <li key={idx}>
                                {seg.leftLabel}: {formatDateTime(seg.left.toISOString())} 〜 {seg.rightLabel}: {formatDateTime(seg.right.toISOString())}
                              </li>
                            ))}
                          </ul>
                          </div>
                          {(() => {
                            const totals = calcTotals(customer, breaksMap[customer.id] ?? []);
                            const stayMs = totals.totalPlayMs + totals.totalStopMs;
                            return (
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-gray-50 rounded border">
                                  <div className="text-sm text-gray-500">滞在時間</div>
                                  <div className="text-lg font-semibold text-gray-800">
                                    {formatMs(stayMs)}
                                  </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                  <div className="text-sm text-gray-500">総プレイ時間</div>
                                  <div className="text-lg font-semibold text-gray-800">
                                    {formatMs(totals.totalPlayMs)}
                                  </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                  <div className="text-sm text-gray-500">総停止時間</div>
                                  <div className="text-lg font-semibold text-gray-800">
                                    {formatMs(totals.totalStopMs)}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
