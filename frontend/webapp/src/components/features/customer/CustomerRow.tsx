"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/features/customer/types";
import { Star, Play, Pause } from "lucide-react";

type CustomerRowProps = {
  customer: Customer;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleBreak: () => void;
  onOrder: () => void;
  onPayment: () => void;
  animationDelayMs?: number;
};

export function CustomerRow({
  customer,
  expanded,
  onToggleExpand,
  onToggleBreak,
  onOrder,
  onPayment,
  animationDelayMs = 0,
}: CustomerRowProps) {
  return (
    <div
      className="animate-slide-in-up"
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <div
        className="surface-elevated rounded-lg p-4 flex items-center justify-between border border-border/50 hover:border-primary/50 transition-all duration-300 mb-3 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex-1 flex items-center font-medium text-foreground gap-3">
          <span
            className="text-muted-foreground group-hover:text-primary transition-colors duration-200"
            aria-label="詳細を展開"
            title="詳細を展開"
          >
            {expanded ? "▲" : "▼"}
          </span>
          <Star
            className={`w-4 h-4 fill-primary text-primary animate-pulse ${
              customer.isMember ? "" : "invisible"
            }`}
          />
          <span className="group-hover:text-primary transition-colors duration-200">
            {customer.name}
          </span>
        </div>
        <div className="flex-1 flex items-center gap-2 text-muted-foreground">
          {customer.isBreaking ? (
            <span className="flex items-center gap-1 text-orange-400 animate-pulse w-24">
              <Pause className="w-4 h-4" />
              休憩中
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-400 w-24">
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleBreak();
            }}
          >
            {customer.isBreaking ? "再開" : "停止"}
          </Button>
          <Button
            className="bg-[var(--success)] hover:bg-[var(--success)]/90 text-white font-medium rounded-lg px-6 hover:scale-105 transition-transform duration-200 hover:shadow-lg hover:shadow-green-500/30"
            onClick={(e) => {
              e.stopPropagation();
              onOrder();
            }}
          >
            注文
          </Button>
          <Button
            variant="destructive"
            className="font-medium rounded-lg px-6 hover:scale-105 transition-transform duration-200 hover:shadow-lg hover:shadow-red-500/30"
            disabled={!customer.isBreaking}
            onClick={(e) => {
              e.stopPropagation();
              onPayment();
            }}
          >
            会計
          </Button>
        </div>
      </div>
    </div>
  );
}


