"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { AppSidebar } from "../../components/layout/sidebar";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

const menuSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください"),
  price: z.number().min(0, "価格は0以上で入力してください"),
  category_id: z.number().int().nonnegative().nullable().optional(),
})

type MenuForm = z.infer<typeof menuSchema>
type Category = { id: number; name: string }
type MenuItem = { id: number; name: string; price: number; category_name: string }

export default function MenuAdminPage() {
  const { control, handleSubmit, reset } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: "",
      price: 0,
      category_id: null,
    },
  })
  const [categories, setCategories] = useState<Array<Category>>([])
  const [menus, setMenus] = useState<Array<MenuItem>>([])
  const [isLoadingMenus, setIsLoadingMenus] = useState(true)
  const [menuEditId, setMenuEditId] = useState<number | null>(null)
  const [menuEdit, setMenuEdit] = useState<{ name: string; price: number; category_id: number | null }>({
    name: "",
    price: 0,
    category_id: null,
  })
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"all" | "uncategorized" | number>("all")

  const fetchCategories = async () => {
    try {
      const list = await apiFetch<Array<Category>>("/menu/api/category/");
      setCategories(list);
    } catch {
      setCategories([]);
    }
  }

  const fetchMenus = async () => {
    setIsLoadingMenus(true)
    try {
      const list = await apiFetch<Array<MenuItem>>("/menu/api/menu/");
      setMenus(list.sort((a, b) => a.id - b.id))
    } catch {
      setMenus([])
    } finally {
      setIsLoadingMenus(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchMenus()
  }, [])

  const onSubmit = async (data: MenuForm) => {
    try {
      await apiFetch("/menu/api/menu/", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          category_id: data.category_id ?? undefined,
        }),
      })
      alert("メニューを登録しました ✅")
      reset({
        name: "",
        price: 0,
        category_id: null,
      })
      fetchMenus()
    } catch (err) {
      alert(err)
    }
  }

  const startEditMenu = (m: MenuItem) => {
    const currentCategoryId =
      categories.find((c) => c.name === m.category_name)?.id ?? null
    setMenuEditId(m.id)
    setMenuEdit({
      name: m.name,
      price: m.price,
      category_id: currentCategoryId,
    })
  }

  const saveEditMenu = async (id: number) => {
    const payload = {
      name: menuEdit.name.trim(),
      price: menuEdit.price,
      category_id: menuEdit.category_id,
    }
    if (!payload.name) {
      alert("メニュー名を入力してください")
      return
    }
    try {
      await apiFetch(`/menu/api/menu/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      setMenuEditId(null)
      await fetchMenus()
      alert("メニューを更新しました ✅")
    } catch (err) {
      alert(err)
    }
  }

  const cancelEditMenu = () => {
    setMenuEditId(null)
  }

  // カテゴリーフィルターロジック
  const filteredMenus = menus.filter((m) => {
    if (selectedCategoryFilter === "all") return true
    if (selectedCategoryFilter === "uncategorized") return !m.category_name || m.category_name === "未分類"
    const category = categories.find((c) => c.id === selectedCategoryFilter)
    return category && m.category_name === category.name
  })

  // 削除機能は無効化（ボタン/ロジックを削除）

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-foreground">メニュー管理</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* 左側：メニュー登録 */}
          <div className="bg-surface-elevated border border-border/50 rounded-xl p-6 shadow-sm h-fit">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-2">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新規登録
              </h2>
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-transparent rounded-full opacity-30"></div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input {...field} placeholder="メニュー名" className="border border-border/50 bg-input/50 text-foreground p-2 rounded" />
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <input {...field} type="number" placeholder="価格" className="border border-border/50 bg-input/50 text-foreground p-2 rounded" value={field.value || ""} onChange={e => field.onChange(e.target.valueAsNumber)}/>
              )}
            />
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <select
                  className="border border-border/50 bg-input/50 text-foreground p-2 rounded"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    field.onChange(v);
                  }}
                >
                  <option value="">（未分類）</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            />
            <button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white p-2.5 rounded-lg font-medium shadow-md">
              登録
            </button>
          </form>
          </div>

          {/* 真ん中：メニュー一覧 */}
          <div className="bg-surface-elevated border border-border/50 rounded-xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  一覧
                </h2>
                {!isLoadingMenus && (
                  <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-semibold rounded-full text-sm">
                    {filteredMenus.length} 件
                  </span>
                )}
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-transparent rounded-full opacity-30"></div>
            </div>

            {/* カテゴリーフィルター */}
            <div className="mb-5">
              <label className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                カテゴリー絞り込み
              </label>
              <select
                className="w-full border border-border/50 bg-input/50 text-foreground px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value={selectedCategoryFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all" || val === "uncategorized") {
                    setSelectedCategoryFilter(val);
                  } else {
                    setSelectedCategoryFilter(Number(val));
                  }
                }}
              >
                <option value="all">すべて</option>
                <option value="uncategorized">未分類</option>
                {categories.filter((c) => c.name !== "未分類").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              {isLoadingMenus && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary"></div>
                    <p className="text-sm text-muted-foreground">読み込み中...</p>
                  </div>
                </div>
              )}
              {!isLoadingMenus && menus.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base text-muted-foreground mb-1">メニューがありません</p>
                  <p className="text-sm text-muted-foreground/70">上のフォームから新しいメニューを追加してください</p>
                </div>
              )}
              {!isLoadingMenus && menus.length > 0 && filteredMenus.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-base text-muted-foreground mb-1">該当するメニューがありません</p>
                  <p className="text-sm text-muted-foreground/70">別のカテゴリーを選択してください</p>
                </div>
              )}
              {!isLoadingMenus && filteredMenus.length > 0 && (
                <div className="grid gap-3">
                  {filteredMenus.map((m, idx) => (
                    <div
                      key={m.id}
                      className="bg-surface-elevated border border-border/50 rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-slide-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {menuEditId === m.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-muted-foreground">メニュー名</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={menuEdit.name}
                                onChange={(e) => setMenuEdit({ ...menuEdit, name: e.target.value })}
                                placeholder="メニュー名"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-muted-foreground">価格</label>
                              <input
                                type="number"
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={Number.isFinite(menuEdit.price) ? menuEdit.price : 0}
                                onChange={(e) => setMenuEdit({ ...menuEdit, price: e.target.valueAsNumber })}
                                placeholder="価格"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-muted-foreground">カテゴリー</label>
                              <select
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={menuEdit.category_id ?? ""}
                                onChange={(e) =>
                                  setMenuEdit({
                                    ...menuEdit,
                                    category_id: e.target.value === "" ? null : Number(e.target.value),
                                  })
                                }
                              >
                                <option value="">（未分類）</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={cancelEditMenu}
                              className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-foreground transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditMenu(m.id)}
                              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg transition-opacity shadow-md"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-background/50 to-transparent rounded-lg p-3 border border-border/30">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">メニュー名</div>
                              <div className="text-lg font-bold text-foreground">{m.name}</div>
                            </div>
                            <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-3 border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">価格</div>
                              <div className="text-xl font-bold text-primary tabular-nums">¥{m.price.toLocaleString()}</div>
                            </div>
                            <div className="bg-gradient-to-br from-secondary/5 to-transparent rounded-lg p-3 border border-secondary/20">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">カテゴリー</div>
                              <div className="text-lg font-bold text-secondary">{m.category_name || "未分類"}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditMenu(m)}
                            className="px-5 py-2.5 border border-border hover:bg-muted hover:border-primary/50 rounded-lg text-foreground transition-all ml-4 font-medium"
                          >
                            編集
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>

          {/* 右側：空 */}
          <div className="hidden lg:block">
            {/* 将来的に機能を追加する場合はここに配置 */}
          </div>
        </div>
      </main>
    </div>
  )
}

