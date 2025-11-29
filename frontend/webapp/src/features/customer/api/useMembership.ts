"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toE164 } from "../utils";
import type { MembershipSearchResult } from "../types";

type UseMembershipOptions = {
  customerId: string;
  onLinked?: (membershipId: number) => void;
};

type UseMembershipResult = {
  countryCode: string;
  phoneNumber: string;
  setCountryCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  results: MembershipSearchResult[];
  searchError: string | null;
  isSearching: boolean;
  isLinking: boolean;
  updatingById: Record<number, boolean>;
  search: () => Promise<void>;
  link: (membershipId: number) => Promise<void>;
  updateRegisterDate: (membershipId: number) => Promise<void>;
};

export function useMembership({
  customerId,
  onLinked,
}: UseMembershipOptions): UseMembershipResult {
  const [countryCode, setCountryCode] = useState("+81");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [results, setResults] = useState<MembershipSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [updatingById, setUpdatingById] = useState<Record<number, boolean>>({});

  const search = useCallback(async () => {
    setSearchError(null);
    setResults([]);

    const num = phoneNumber.trim();
    if (!num) {
      setSearchError("電話番号を入力してください");
      return;
    }

    const e164 = toE164(countryCode, num);
    if (!e164) {
      setSearchError("有効な電話番号を入力してください");
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch<any>(
        `/customer/api/membership/?phone_number=${encodeURIComponent(e164)}`,
      );
      const list: MembershipSearchResult[] = Array.isArray(res)
        ? res
        : res?.results ?? [];
      setResults(list);
      if (list.length === 0) {
        setSearchError("該当する会員が見つかりませんでした");
      }
    } catch (e) {
      console.error("Failed to search membership:", e);
      setSearchError(
        "会員検索に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSearching(false);
    }
  }, [countryCode, phoneNumber]);

  const link = useCallback(
    async (membershipId: number) => {
      setSearchError(null);
      setIsLinking(true);
      try {
        await apiFetch(`/customer/api/customer/${customerId}/`, {
          method: "PATCH",
          body: JSON.stringify({ membership: membershipId }),
        });

        // 親に通知（状態更新や再取得など）
        onLinked?.(membershipId);

        // 結果をクリア
        setResults([]);
      } catch (e) {
        console.error("Failed to link membership:", e);
        const msg =
          e instanceof Error
            ? e.message
            : "会員紐付けに失敗しました。もう一度お試しください。";
        setSearchError(msg);
      } finally {
        setIsLinking(false);
      }
    },
    [customerId, onLinked],
  );

  const updateRegisterDate = useCallback(
    async (membershipId: number) => {
      const confirmed = window.confirm(
        "会員情報を更新してもよろしいですか？\n登録日が本日の日付に更新されます。",
      );
      if (!confirmed) {
        return;
      }

      setUpdatingById((prev) => ({ ...prev, [membershipId]: true }));
      try {
        await apiFetch(
          `/customer/api/membership/${membershipId}/update-register-date/`,
          {
            method: "POST",
            body: JSON.stringify({}),
          },
        );

        // 成功したら最新状態を反映するために再検索
        await search();

        alert("会員情報が更新されました。");
      } catch (e) {
        console.error("Failed to update membership register_date:", e);
        setSearchError(
          "会員情報の更新に失敗しました。もう一度お試しください。",
        );
      } finally {
        setUpdatingById((prev) => ({ ...prev, [membershipId]: false }));
      }
    },
    [search],
  );

  return {
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
  };
}


