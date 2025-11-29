"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
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
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setIsModalOpen(false)
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-24">
          {/* メニュー登録ボタン */}
          <div className="mb-8 animate-slide-in-up">
            <Button
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 text-white font-medium text-base px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-primary/50"
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              メニュー登録
            </Button>
          </div>

          {/* メニュー一覧 */}
          <div className="space-y-4">
            {/* ヘッダー：タイトルとカテゴリー絞り込み */}
            <div className="flex items-center justify-between mb-4 animate-slide-in-left">
              <h2 className="text-xl font-semibold text-foreground">一覧</h2>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <select
                  className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
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
            </div>
            {isLoadingMenus ? (
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : menus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground animate-fade-in">
                メニューがありません
              </div>
            ) : filteredMenus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground animate-fade-in">
                該当するメニューがありません
              </div>
            ) : (
              filteredMenus.map((m, index) => (
                <div 
                  key={m.id} 
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="surface-elevated rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group"
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
                          <Button
                            type="button"
                            onClick={cancelEditMenu}
                            variant="secondary"
                            className="font-medium rounded-lg px-6"
                          >
                            キャンセル
                          </Button>
                          <Button
                            type="button"
                            onClick={() => saveEditMenu(m.id)}
                            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium rounded-lg px-6"
                          >
                            保存
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-4">
                          <span className="text-foreground font-medium group-hover:text-primary transition-colors duration-200">
                            {m.name}
                          </span>
                          <span className="text-primary font-bold text-lg">
                            ¥{m.price.toLocaleString()}
                          </span>
                          <span className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs font-medium">
                            {m.category_name || "未分類"}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          className="font-medium rounded-lg px-6"
                          onClick={() => startEditMenu(m)}
                        >
                          編集
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
            <div 
              className="bg-background border border-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-slide-in-up" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">メニュー登録</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="閉じる"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">メニュー名</label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="メニュー名" className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg" />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">価格</label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="number" placeholder="価格" className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg" value={field.value || ""} onChange={e => field.onChange(e.target.valueAsNumber)}/>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">カテゴリー</label>
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <select
                        className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg"
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
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    className="font-medium rounded-lg px-6"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium rounded-lg px-6"
                  >
                    登録
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
