"use client";

import { Button } from "@/components/ui/button";
import { useMembership } from "@/features/customer/api/useMembership";
import type { MembershipSearchResult } from "@/features/customer/types";

type MembershipSectionProps = {
  customerId: string;
  onLinked: () => void;
};

export function MembershipSection({
  customerId,
  onLinked,
}: MembershipSectionProps) {
  const {
    countryCode,
    phoneNumber,
    setCountryCode,
    setPhoneNumber,
    results,
    searchError,
    isSearching,
    isLinking,
    updatingById,
    search,
    link,
    updateRegisterDate,
  } = useMembership({
    customerId,
    onLinked: () => {
      onLinked();
    },
  });

  return (
    <div className="bg-card/40 rounded-md p-4 border border-dashed border-primary/40 mb-4 mt-1 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col gap-1 mb-3">
        <div className="text-sm font-semibold text-foreground">会員紐付け</div>
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
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
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
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-1 md:mt-0 px-4"
          disabled={isSearching}
          onClick={() => {
            void search();
          }}
        >
          {isSearching ? "検索中..." : "会員検索"}
        </Button>
      </div>
      {searchError && (
        <div className="mt-2 text-xs text-destructive">{searchError}</div>
      )}
      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((m: MembershipSearchResult) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-2 rounded border border-border/40 bg-muted/20"
            >
              <div className="text-xs">
                <div className="text-foreground">
                  {m.last_name} {m.first_name}
                </div>
                {m.phone_number && (
                  <div className="text-muted-foreground">{m.phone_number}</div>
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
                  disabled={!!updatingById[m.id]}
                  onClick={() => {
                    void updateRegisterDate(m.id);
                  }}
                >
                  {updatingById[m.id] ? "更新中..." : "更新"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="px-3 py-1 text-xs"
                  disabled={isLinking}
                  onClick={() => {
                    void link(m.id);
                  }}
                >
                  {isLinking ? "紐付け中..." : "この会員に紐付け"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


