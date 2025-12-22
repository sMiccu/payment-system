"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type PaymentFiltersProps = {
  customerId: string | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  onChangeStartDate: (value: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndDate: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onRecalculate: () => Promise<void>;
  loading: boolean;
};

export function PaymentFilters({
  customerId,
  startDate,
  startTime,
  endDate,
  endTime,
  onChangeStartDate,
  onChangeStartTime,
  onChangeEndDate,
  onChangeEndTime,
  onRecalculate,
  loading,
}: PaymentFiltersProps) {
  const handleRecalculate = React.useCallback(() => {
    void onRecalculate();
  }, [onRecalculate]);

  return (
    <div className="flex items-end gap-4">
      <div className="flex flex-col">
        <label className="text-sm text-muted-foreground">
          開始日 / 開始時刻（任意）
        </label>
        <input
          className="border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-72"
          type="date"
          value={startDate}
          onChange={(e) => onChangeStartDate(e.target.value)}
        />
        <input
          className="mt-2 border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-40"
          type="time"
          value={startTime}
          onChange={(e) => onChangeStartTime(e.target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm text-muted-foreground">
          終了日 / 終了時刻（任意）
        </label>
        <input
          className="border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-72"
          type="date"
          value={endDate}
          onChange={(e) => onChangeEndDate(e.target.value)}
        />
        <input
          className="mt-2 border border-border/50 bg-input/50 text-foreground rounded px-3 py-2 w-40"
          type="time"
          value={endTime}
          onChange={(e) => onChangeEndTime(e.target.value)}
        />
      </div>
      <Button
        onClick={handleRecalculate}
        disabled={!customerId || loading}
      >
        {loading ? "更新中..." : "再計算"}
      </Button>
    </div>
  );
}


