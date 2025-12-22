"use client";

import * as React from "react";
import { fetchMenus, type MenuItem } from "@/lib/api";

type UseMenusResult = {
  menus: MenuItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useMenus(): UseMenusResult {
  const [menus, setMenus] = React.useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchMenus();
      setMenus(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "メニューの取得に失敗しました";
      setError(msg);
      console.error("Failed to fetch menus:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    menus,
    isLoading,
    error,
    reload: load,
  };
}


