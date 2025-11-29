"use client";

import type { Customer, CustomerBreak } from "@/features/customer/types";
import type {
  PaymentSummaryResponse,
  CustomerQuoteResponse,
} from "@/lib/api";
import { formatCurrency, formatDateTime, formatMs } from "@/lib/utils/format";
import { ShoppingCart, Coins, Play, Pause } from "lucide-react";

const TAX_RATE = 0.1;

type CustomerDetailsProps = {
  customer: Customer;
  breaks: CustomerBreak[];
  orderSummary?: PaymentSummaryResponse;
  quote?: CustomerQuoteResponse;
  breaksLoading: boolean;
  summaryLoading: boolean;
  breakError?: string | null;
};

type PlaySegment = {
  leftLabel: "開始" | "再開";
  left: Date;
  rightLabel: "停止" | "現在" | "会計";
  right: Date;
};

const calcTotals = (customer: Customer, breaks: CustomerBreak[]) => {
  const now = new Date();
  const start = customer.startDatetime
    ? new Date(customer.startDatetime)
    : null;
  const end = customer.endDatetime ? new Date(customer.endDatetime) : null;
  let totalStopMs = 0;
  for (const b of breaks) {
    if (!b.start_datetime) continue;
    const bs = new Date(b.start_datetime);
    const be = b.end_datetime ? new Date(b.end_datetime) : now;
    if (end && be > end) {
      // 過剰分は切り詰め
      totalStopMs += Math.max(
        0,
        Math.min(end.getTime(), be.getTime()) - bs.getTime(),
      );
    } else {
      totalStopMs += Math.max(0, be.getTime() - bs.getTime());
    }
  }
  let totalPlayMs = 0;
  if (start) {
    const playEnd = end ?? now;
    totalPlayMs = Math.max(
      0,
      playEnd.getTime() - start.getTime() - totalStopMs,
    );
  }
  return { totalPlayMs, totalStopMs };
};

const getPlaySegments = (
  customer: Customer,
  breaks: CustomerBreak[],
): PlaySegment[] => {
  const segments: PlaySegment[] = [];
  if (!customer.startDatetime) return segments;
  const startAt = new Date(customer.startDatetime);
  const endAt = customer.endDatetime ? new Date(customer.endDatetime) : null;
  const sorted = [...breaks]
    .filter((b) => !!b.start_datetime)
    .sort((a, b) => {
      return (
        new Date(a.start_datetime as string).getTime() -
        new Date(b.start_datetime as string).getTime()
      );
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

export function CustomerDetails({
  customer,
  breaks,
  orderSummary,
  quote,
  breaksLoading,
  summaryLoading,
  breakError,
}: CustomerDetailsProps) {
  if (breaksLoading || summaryLoading) {
    return (
      <div className="bg-card/50 rounded-md p-4 border border-border/50 mb-3 backdrop-blur-sm animate-slide-in-up overflow-hidden space-y-4">
        <div className="text-muted-foreground animate-pulse">
          読み込み中...
        </div>
      </div>
    );
  }

  if (breakError) {
    return (
      <div className="bg-card/50 rounded-md p-4 border border-border/50 mb-3 backdrop-blur-sm animate-slide-in-up overflow-hidden space-y-4">
        <div className="text-destructive animate-fade-in">{breakError}</div>
      </div>
    );
  }

  const totals = calcTotals(customer, breaks);
  const stayMs = totals.totalPlayMs + totals.totalStopMs;

  const timeSubtotal = quote ? Number(quote.subtotal) : 0;
  const orderTotal = orderSummary ? Number(orderSummary.order_total) : 0;
  const grandTotal = timeSubtotal + orderTotal;
  const tax = Math.floor(grandTotal * TAX_RATE);
  const totalWithTax = grandTotal + tax;

  const segments = getPlaySegments(customer, breaks);

  return (
    <div className="bg-card/50 rounded-md p-4 border border-border/50 mb-3 backdrop-blur-sm animate-slide-in-up overflow-hidden space-y-4">
      {/* 注文内容と料金情報を横並び */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border/30 pb-4">
        {/* 現在の注文情報 */}
        {orderSummary && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <ShoppingCart className="w-4 h-4 text-primary" />
              注文内容
            </div>
            {orderSummary.items.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                注文はありません
              </div>
            ) : (
              <div className="space-y-2">
                {orderSummary.items.map((item, idx) => (
                  <div
                    key={item.menu_id}
                    className="flex justify-between items-center text-sm animate-slide-in-left"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span className="text-foreground">
                      {item.menu_name} × {item.quantity}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border/20">
                  <span className="text-muted-foreground">注文小計</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(orderSummary.order_total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 現在の料金情報 */}
        {quote && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <Coins className="w-4 h-4 text-primary" />
              現在の料金
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">時間料金</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(quote.subtotal)}
                </span>
              </div>
              {orderSummary && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">注文料金</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(orderSummary.order_total)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-border/20">
                <span className="text-muted-foreground">小計（税抜）</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(String(grandTotal))}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">消費税（10%）</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(String(tax))}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/20">
                <span className="font-semibold text-foreground">合計（税込）</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(String(totalWithTax))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 履歴 */}
      <div className="animate-fade-in">
        <div className="font-semibold text-foreground mb-3">履歴</div>
        <div className="space-y-2">
          {segments.map((seg, idx) => (
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
                  <span className="text-foreground font-medium">
                    {seg.leftLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDateTime(seg.left.toISOString())}
                  </span>
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
                  <span className="text-foreground font-medium">
                    {seg.rightLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDateTime(seg.right.toISOString())}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 時間統計 */}
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
    </div>
  );
}


