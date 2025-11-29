"use client";

import type { NextPage } from "next";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  fetchCustomerQuote,
  fetchCustomerPaymentSummary,
  type CustomerQuoteResponse,
  type PaymentSummaryResponse,
} from "@/lib/api";
import { Star, Play, Pause, ShoppingCart, Coins } from "lucide-react";

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

type MembershipSearchResult = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number?: string;
  register_date?: string;
  is_expired?: boolean;
};

// 表示用の顧客データの型定義
type Customer = {
  id: string;
  name: string;
  startTime: string;
  isBreaking: boolean;
  startDatetime: string | null;
  endDatetime: string | null;
  isMember: boolean;
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

  // 注文情報と料金情報
  const [orderSummaryMap, setOrderSummaryMap] = useState<Record<string, PaymentSummaryResponse>>({});
  const [quoteMap, setQuoteMap] = useState<Record<string, CustomerQuoteResponse>>({});
  const [summaryLoading, setSummaryLoading] = useState<Record<string, boolean>>({});

  // 会員紐付け用の状態
  const [membershipPhone, setMembershipPhone] = useState<Record<string, string>>({});
  const [membershipCountryCode, setMembershipCountryCode] = useState<Record<string, string>>({});
  const [membershipResults, setMembershipResults] = useState<Record<string, MembershipSearchResult[]>>({});
  const [membershipSearchError, setMembershipSearchError] = useState<Record<string, string | null>>({});
  const [membershipSearchLoading, setMembershipSearchLoading] = useState<Record<string, boolean>>({});
  const [membershipLinking, setMembershipLinking] = useState<Record<string, boolean>>({});
  const [membershipUpdating, setMembershipUpdating] = useState<Record<number, boolean>>({});

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
      
      // 展開中なら即座にデータを更新
      if (expanded[customerId]) {
        fetchCustomerData(customerId);
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setError(`休止/再開の操作に失敗しました: ${errorMessage}`);
      console.error("Failed to toggle break:", e);
    }
  };

  // お客様データを取得する共通関数
  const fetchCustomerData = useCallback(async (customerId: string) => {
    try {
      // 並行で3つのデータを取得
      const [breaks, orderSummary, quote] = await Promise.all([
        apiFetch<CustomerBreak[]>(
          `/customer/api/customer_break/?customer=${customerId}`
        ),
        fetchCustomerPaymentSummary(customerId),
        fetchCustomerQuote(customerId),
      ]);
      
      setBreaksMap((prev) => ({ ...prev, [customerId]: breaks }));
      setOrderSummaryMap((prev) => ({ ...prev, [customerId]: orderSummary }));
      setQuoteMap((prev) => ({ ...prev, [customerId]: quote }));
      setBreaksError((prev) => ({ ...prev, [customerId]: null }));
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setBreaksError((prev) => ({
        ...prev,
        [customerId]: `データの取得に失敗しました: ${errorMessage}`,
      }));
    }
  }, []);

  const toggleExpand = async (customerId: string) => {
    const next = !expanded[customerId];
    setExpanded((prev) => ({ ...prev, [customerId]: next }));
    
    if (next && !breaksMap[customerId] && !breaksLoading[customerId]) {
      setBreaksLoading((prev) => ({ ...prev, [customerId]: true }));
      setSummaryLoading((prev) => ({ ...prev, [customerId]: true }));
      
      await fetchCustomerData(customerId);
      
      setBreaksLoading((prev) => ({ ...prev, [customerId]: false }));
      setSummaryLoading((prev) => ({ ...prev, [customerId]: false }));
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

  const formatCurrency = (s: string): string => {
    const n = Number(s);
    if (Number.isNaN(n)) return s;
    return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  };

  const TAX_RATE = 0.1;

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

  const toE164 = (countryCode: string, national: string) => {
    const rawDigits = national.replace(/[^0-9]/g, "");
    const codeDigits = countryCode.replace("+", "");
    const nationalDigits =
      countryCode === "+81" && rawDigits.startsWith("0") ? rawDigits.slice(1) : rawDigits;
    if (!nationalDigits) return "";
    return `+${codeDigits}${nationalDigits}`;
  };

  const handleMembershipSearch = useCallback(
    async (customerId: string) => {
      const cc = membershipCountryCode[customerId] ?? "+81";
      const num = (membershipPhone[customerId] ?? "").trim();

      setMembershipSearchError((prev) => ({ ...prev, [customerId]: null }));
      setMembershipResults((prev) => ({ ...prev, [customerId]: [] }));

      if (!num) {
        setMembershipSearchError((prev) => ({
          ...prev,
          [customerId]: "電話番号を入力してください",
        }));
        return;
      }

      const e164 = toE164(cc, num);
      if (!e164) {
        setMembershipSearchError((prev) => ({
          ...prev,
          [customerId]: "有効な電話番号を入力してください",
        }));
        return;
      }

      setMembershipSearchLoading((prev) => ({ ...prev, [customerId]: true }));
      try {
        const res = await apiFetch<any>(
          `/customer/api/membership/?phone_number=${encodeURIComponent(e164)}`,
        );
        const list: MembershipSearchResult[] = Array.isArray(res)
          ? res
          : (res?.results ?? []);
        setMembershipResults((prev) => ({ ...prev, [customerId]: list }));
        if (list.length === 0) {
          setMembershipSearchError((prev) => ({
            ...prev,
            [customerId]: "該当する会員が見つかりませんでした",
          }));
        }
      } catch (e) {
        setMembershipSearchError((prev) => ({
          ...prev,
          [customerId]:
            "会員検索に失敗しました。時間をおいて再度お試しください。",
        }));
        console.error("Failed to search membership:", e);
      } finally {
        setMembershipSearchLoading((prev) => ({ ...prev, [customerId]: false }));
      }
    },
    [membershipCountryCode, membershipPhone],
  );

  const handleLinkMembership = useCallback(
    async (customerId: string, membershipId: number) => {
      setMembershipSearchError((prev) => ({ ...prev, [customerId]: null }));
      setMembershipLinking((prev) => ({ ...prev, [customerId]: true }));
      try {
        await apiFetch(`/customer/api/customer/${customerId}/`, {
          method: "PATCH",
          body: JSON.stringify({ membership: membershipId }),
        });

        // フロント側の状態を会員として更新
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId ? { ...c, isMember: true } : c,
          ),
        );

        // 見積/注文などの情報も会員価格で再取得
        await fetchCustomerData(customerId);

        // 結果をクリア（任意）
        setMembershipResults((prev) => ({ ...prev, [customerId]: [] }));
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "会員紐付けに失敗しました。もう一度お試しください。";
        setMembershipSearchError((prev) => ({ ...prev, [customerId]: msg }));
        console.error("Failed to link membership:", e);
      } finally {
        setMembershipLinking((prev) => ({ ...prev, [customerId]: false }));
      }
    },
    [fetchCustomerData],
  );

  async function handleUpdateMembershipRegisterDate(customerId: string, membershipId: number) {
    const confirmed = window.confirm(
      "会員情報を更新してもよろしいですか？\n登録日が本日の日付に更新されます。"
    );
    if (!confirmed) {
      return;
    }

    setMembershipUpdating((prev) => ({ ...prev, [membershipId]: true }));
    try {
      await apiFetch(`/customer/api/membership/${membershipId}/update-register-date/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      // 最新の有効期限状態を反映するため再検索
      await handleMembershipSearch(customerId);

      alert("会員情報を更新しました。");
    } catch (e) {
      setMembershipSearchError((prev) => ({
        ...prev,
        [customerId]: "会員情報の更新に失敗しました。もう一度お試しください。",
      }));
      console.error("Failed to update membership register_date:", e);
    } finally {
      setMembershipUpdating((prev) => ({ ...prev, [membershipId]: false }));
    }
  }

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
            isMember: customer.membership !== null,
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

  // 展開中のお客様のデータを定期的に更新（30秒ごと）
  useEffect(() => {
    const expandedIds = Object.entries(expanded)
      .filter(([_, isExpanded]) => isExpanded)
      .map(([id]) => id);

    if (expandedIds.length === 0) {
      return; // 展開中のお客様がいない場合は何もしない
    }

    // 初回は即座に更新
    expandedIds.forEach((customerId) => {
      fetchCustomerData(customerId);
    });

    // 30秒ごとに更新
    const interval = setInterval(() => {
      expandedIds.forEach((customerId) => {
        fetchCustomerData(customerId);
      });
    }, 30000); // 30秒

    return () => clearInterval(interval);
  }, [expanded, fetchCustomerData]);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-24">
          {/* 来店登録ボタン */}
          <div className="mb-8 animate-slide-in-up">
            <Button
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 text-white font-medium text-base px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-primary/50"
              size="lg"
              onClick={() => router.push("/customer-register")}
            >
              来店登録
            </Button>
          </div>

          {/* 顧客リスト */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-foreground animate-slide-in-left">来店中のお客様</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-20 surface-elevated rounded-lg border border-border/50 animate-pulse"
                  >
                    <div className="h-full p-4 flex items-center gap-4">
                      <div className="h-4 bg-muted/30 rounded w-1/4 animate-shimmer"></div>
                      <div className="h-4 bg-muted/30 rounded w-1/4 animate-shimmer"></div>
                      <div className="ml-auto flex gap-2">
                        <div className="h-8 w-16 bg-muted/30 rounded"></div>
                        <div className="h-8 w-16 bg-muted/30 rounded"></div>
                        <div className="h-8 w-16 bg-muted/30 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive animate-fade-in">
                {error}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground animate-fade-in">
                来店中の顧客はいません
              </div>
            ) : (
              customers.map((customer, index) => (
                <div 
                  key={customer.id} 
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="surface-elevated rounded-lg p-4 flex items-center justify-between border border-border/50 hover:border-primary/50 transition-all duration-300 mb-3 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group"
                  >
                    <div className="flex-1 flex items-center font-medium text-foreground gap-3">
                      <button
                        className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:scale-110 transform"
                        onClick={() => toggleExpand(customer.id)}
                        aria-label="詳細を展開"
                        title="詳細を展開"
                      >
                        {expanded[customer.id] ? "▲" : "▼"}
                      </button>
                      {customer.isMember && (
                        <Star className="w-4 h-4 fill-primary text-primary animate-pulse" />
                      )}
                      <span className="group-hover:text-primary transition-colors duration-200">{customer.name}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 text-muted-foreground">
                      {customer.isBreaking ? (
                        <span className="flex items-center gap-1 text-orange-400 animate-pulse">
                          <Pause className="w-4 h-4" />
                          休憩中
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400">
                          <Play className="w-4 h-4 animate-pulse" />
                          プレイ中
                        </span>
                      )}
                      <span className="ml-2">開始: {customer.startTime}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="secondary"
                        className="font-medium rounded-lg px-6 hover:scale-105 transition-transform duration-200"
                        onClick={() => toggleBreak(customer.id, customer.isBreaking)}
                      >
                        {customer.isBreaking ? "再開" : "停止"}
                      </Button>
                      <Button
                        className="bg-[var(--success)] hover:bg-[var(--success)]/90 text-white font-medium rounded-lg px-6 hover:scale-105 transition-transform duration-200 hover:shadow-lg hover:shadow-green-500/30"
                        onClick={() =>
                          router.push(
                            `/order?customerId=${customer.id}&customerName=${encodeURIComponent(
                              customer.name,
                            )}`,
                          )
                        }
                      >
                        注文
                      </Button>
                      <Button
                        variant="destructive"
                        className="font-medium rounded-lg px-6 hover:scale-105 transition-transform duration-200 hover:shadow-lg hover:shadow-red-500/30"
                        disabled={!customer.isBreaking}
                        onClick={() =>
                          router.push(
                            `/payment?customerId=${customer.id}&customerName=${encodeURIComponent(
                              customer.name,
                            )}`,
                          )
                        }
                      >
                        会計
                      </Button>
                    </div>
                  </div>
                  {expanded[customer.id] && (
                    <div className="bg-card/50 rounded-md p-4 border border-border/50 mb-3 backdrop-blur-sm animate-slide-in-up overflow-hidden space-y-4">
                      {breaksLoading[customer.id] || summaryLoading[customer.id] ? (
                        <div className="text-muted-foreground animate-pulse">読み込み中...</div>
                      ) : breaksError[customer.id] ? (
                        <div className="text-destructive animate-fade-in">{breaksError[customer.id]}</div>
                      ) : (
                        <>
                          {/* 注文内容と料金情報を横並び */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border/30 pb-4">
                            {/* 現在の注文情報 */}
                            {orderSummaryMap[customer.id] && (
                              <div className="animate-fade-in">
                                <div className="flex items-center gap-2 font-semibold text-foreground mb-3">
                                  <ShoppingCart className="w-4 h-4 text-primary" />
                                  注文内容
                                </div>
                                {orderSummaryMap[customer.id].items.length === 0 ? (
                                  <div className="text-sm text-muted-foreground">注文はありません</div>
                                ) : (
                                  <div className="space-y-2">
                                    {orderSummaryMap[customer.id].items.map((item, idx) => (
                                      <div 
                                        key={item.menu_id} 
                                        className="flex justify-between items-center text-sm animate-slide-in-left"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                      >
                                        <span className="text-foreground">
                                          {item.menu_name} × {item.quantity}
                                        </span>
                                        <span className="font-medium text-foreground">{formatCurrency(item.line_total)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-border/20">
                                      <span className="text-muted-foreground">注文小計</span>
                                      <span className="font-semibold text-foreground">{formatCurrency(orderSummaryMap[customer.id].order_total)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 現在の料金情報 */}
                            {quoteMap[customer.id] && (
                              <div className="animate-fade-in">
                                <div className="flex items-center gap-2 font-semibold text-foreground mb-3">
                                  <Coins className="w-4 h-4 text-primary" />
                                  現在の料金
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">時間料金</span>
                                    <span className="font-medium text-foreground">{formatCurrency(quoteMap[customer.id].subtotal)}</span>
                                  </div>
                                  {orderSummaryMap[customer.id] && (
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">注文料金</span>
                                      <span className="font-medium text-foreground">{formatCurrency(orderSummaryMap[customer.id].order_total)}</span>
                                    </div>
                                  )}
                                  {(() => {
                                    const timeSubtotal = Number(quoteMap[customer.id].subtotal);
                                    const orderTotal = orderSummaryMap[customer.id] ? Number(orderSummaryMap[customer.id].order_total) : 0;
                                    const grandTotal = timeSubtotal + orderTotal;
                                    const tax = Math.floor(grandTotal * TAX_RATE);
                                    const totalWithTax = grandTotal + tax;
                                    return (
                                      <>
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-border/20">
                                          <span className="text-muted-foreground">小計（税抜）</span>
                                          <span className="font-semibold text-foreground">{formatCurrency(String(grandTotal))}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-muted-foreground">消費税（10%）</span>
                                          <span className="font-medium text-foreground">{formatCurrency(String(tax))}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-border/20">
                                          <span className="font-semibold text-foreground">合計（税込）</span>
                                          <span className="text-xl font-bold text-primary">{formatCurrency(String(totalWithTax))}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 履歴 */}
                          <div className="animate-fade-in">
                            <div className="font-semibold text-foreground mb-3">履歴</div>
                            <div className="space-y-2">
                              {getPlaySegments(customer, breaksMap[customer.id] ?? []).map((seg, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-muted/20 border border-border/30 rounded-lg p-3 hover:border-primary/30 transition-all duration-300 animate-slide-in-left"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      {seg.leftLabel === "開始" ? (
                                        <Play className="w-3 h-3 text-green-400" />
                                      ) : (
                                        <Play className="w-3 h-3 text-blue-400" />
                                      )}
                                      <span className="text-foreground font-medium">{seg.leftLabel}</span>
                                      <span className="text-muted-foreground">{formatDateTime(seg.left.toISOString())}</span>
                                    </div>
                                    <span className="text-muted-foreground">→</span>
                                    <div className="flex items-center gap-2">
                                      {seg.rightLabel === "停止" ? (
                                        <Pause className="w-3 h-3 text-orange-400" />
                                      ) : seg.rightLabel === "会計" ? (
                                        <Coins className="w-3 h-3 text-primary" />
                                      ) : (
                                        <Play className="w-3 h-3 text-green-400" />
                                      )}
                                      <span className="text-foreground font-medium">{seg.rightLabel}</span>
                                      <span className="text-muted-foreground">{formatDateTime(seg.right.toISOString())}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 時間統計 */}
                          {(() => {
                            const totals = calcTotals(customer, breaksMap[customer.id] ?? []);
                            const stayMs = totals.totalPlayMs + totals.totalStopMs;
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-muted/30 rounded border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-105 animate-slide-in-up animation-delay-100">
                                  <div className="text-sm text-muted-foreground">滞在時間</div>
                                  <div className="text-lg font-semibold text-foreground">
                                    {formatMs(stayMs)}
                                  </div>
                                </div>
                                <div className="p-3 bg-muted/30 rounded border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-105 animate-slide-in-up animation-delay-200">
                                  <div className="text-sm text-muted-foreground">総プレイ時間</div>
                                  <div className="text-lg font-semibold text-foreground">
                                    {formatMs(totals.totalPlayMs)}
                                  </div>
                                </div>
                                <div className="p-3 bg-muted/30 rounded border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-105 animate-slide-in-up animation-delay-300">
                                  <div className="text-sm text-muted-foreground">総停止時間</div>
                                  <div className="text-lg font-semibold text-foreground">
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
                  {/* 非会員向け 会員紐付けUI */}
                  {expanded[customer.id] && !customer.isMember && (
                    <div className="bg-card/40 rounded-md p-4 border border-dashed border-primary/40 mb-4 mt-1 backdrop-blur-sm animate-fade-in">
                      <div className="flex flex-col gap-1 mb-3">
                        <div className="text-sm font-semibold text-foreground">
                          会員紐付け
                        </div>
                        <div className="text-xs text-muted-foreground">
                          既に会員登録済みの場合は、電話番号で検索してこの来店と紐付けできます。
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3">
                        <div className="flex items-end gap-2 flex-1">
                          <div className="w-28">
                            <label className="block text-xs text-muted-foreground mb-1">
                              国番号
                            </label>
                            <select
                              value={membershipCountryCode[customer.id] ?? "+81"}
                              onChange={(e) =>
                                setMembershipCountryCode((prev) => ({
                                  ...prev,
                                  [customer.id]: e.target.value,
                                }))
                              }
                              className="w-full border border-border/50 bg-input/50 text-foreground rounded px-2 py-2 text-sm"
                            >
                              <option value="+81">+81</option>
                              <option value="+1">+1</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-muted-foreground mb-1">
                              電話番号
                            </label>
                            <input
                              type="tel"
                              className="w-full border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 text-sm"
                              placeholder="例: 08012345678"
                              value={membershipPhone[customer.id] ?? ""}
                              onChange={(e) =>
                                setMembershipPhone((prev) => ({
                                  ...prev,
                                  [customer.id]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="mt-1 md:mt-0 px-4"
                          disabled={membershipSearchLoading[customer.id]}
                          onClick={() => handleMembershipSearch(customer.id)}
                        >
                          {membershipSearchLoading[customer.id]
                            ? "検索中..."
                            : "会員検索"}
                        </Button>
                      </div>
                      {membershipSearchError[customer.id] && (
                        <div className="mt-2 text-xs text-destructive">
                          {membershipSearchError[customer.id]}
                        </div>
                      )}
                      {(membershipResults[customer.id]?.length ?? 0) > 0 && (
                        <div className="mt-3 space-y-2">
                          {membershipResults[customer.id]!.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-2 rounded border border-border/40 bg-muted/20"
                            >
                              <div className="text-xs">
                                <div className="text-foreground">
                                  {m.last_name} {m.first_name}
                                </div>
                                {m.phone_number && (
                                  <div className="text-muted-foreground">
                                    {m.phone_number}
                                  </div>
                                )}
                                {m.is_expired && (
                                  <div className="text-destructive text-[11px] mt-1 font-semibold">
                                    会員情報の更新が必要です
                                  </div>
                                )}
                              </div>
                              {m.is_expired ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="px-3 py-1 text-xs"
                                  variant="destructive"
                                  disabled={membershipUpdating[m.id]}
                                  onClick={() =>
                                    handleUpdateMembershipRegisterDate(
                                      customer.id,
                                      m.id,
                                    )
                                  }
                                >
                                  {membershipUpdating[m.id]
                                    ? "更新中..."
                                    : "更新"}
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="px-3 py-1 text-xs"
                                  disabled={membershipLinking[customer.id]}
                                  onClick={() =>
                                    handleLinkMembership(customer.id, m.id)
                                  }
                                >
                                  {membershipLinking[customer.id]
                                    ? "紐付け中..."
                                    : "この会員に紐付け"}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
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
