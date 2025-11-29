"use client";

import * as React from "react";
import type { MenuItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

type MenuListProps = {
  menus: MenuItem[];
  isLoading: boolean;
  error: string | null;
  onAddToCart: (menu: MenuItem) => void;
};

export function MenuList({ menus, isLoading, error, onAddToCart }: MenuListProps) {
  const grouped = React.useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    menus.forEach((m) => {
      const key = m.category_name || "未分類";
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], "ja"));
  }, [menus]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {grouped.map(([category, list]) => (
        <div
          key={category}
          className="surface-elevated border border-border/50 rounded p-4"
        >
          <h2 className="text-lg font-medium mb-2 text-foreground">
            {category}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {list.map((m) => (
              <div
                key={m.id}
                className="border border-border/30 bg-card/30 rounded p-3 flex items-center justify-between hover:border-primary/30 transition-all"
              >
                <div>
                  <div className="font-medium text-foreground">{m.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(String(m.price))}
                  </div>
                </div>
                <Button size="sm" onClick={() => onAddToCart(m)}>
                  追加
                </Button>
              </div>
            ))}
            {list.length === 0 && (
              <div className="text-sm text-muted-foreground">
                商品がありません
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


