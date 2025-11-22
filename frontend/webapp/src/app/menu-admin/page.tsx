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

  // 削除機能は無効化（ボタン/ロジックを削除）

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4 text-foreground">メニュー管理</h1>
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
            <button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white p-2 rounded">
              登録
            </button>
          </form>

          <details className="mt-8" open>
            <summary className="cursor-pointer select-none text-base font-medium text-foreground mb-4">メニュー一覧</summary>
            <div className="mt-3 flex flex-col gap-3">
              {isLoadingMenus && <div className="text-sm text-muted-foreground">読み込み中...</div>}
              {!isLoadingMenus && menus.length === 0 && (
                <div className="text-sm text-muted-foreground">メニューがありません。</div>
              )}
              {!isLoadingMenus && menus.length > 0 && (
                <div className="grid gap-3">
                  {menus.map((m, idx) => (
                    <div
                      key={m.id}
                      className="bg-surface-elevated border border-border/50 rounded-lg p-4 hover:border-primary/30 transition-all duration-300 animate-slide-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {menuEditId === m.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground">メニュー名</label>
                            <input
                              className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
                              value={menuEdit.name}
                              onChange={(e) => setMenuEdit({ ...menuEdit, name: e.target.value })}
                              placeholder="メニュー名"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-muted-foreground">価格</label>
                              <input
                                type="number"
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
                                value={Number.isFinite(menuEdit.price) ? menuEdit.price : 0}
                                onChange={(e) => setMenuEdit({ ...menuEdit, price: e.target.valueAsNumber })}
                                placeholder="価格"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-muted-foreground">カテゴリー</label>
                              <select
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
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
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEditMenu}
                              className="px-4 py-2 border border-border hover:bg-muted rounded text-foreground transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditMenu(m.id)}
                              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded transition-opacity"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">{m.name}</h3>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-primary font-medium text-lg">¥{m.price.toLocaleString()}</span>
                              <span className="px-2 py-1 bg-muted/50 text-muted-foreground rounded text-xs">
                                {m.category_name || "未分類"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditMenu(m)}
                            className="px-4 py-2 border border-border hover:bg-muted hover:border-primary/50 rounded text-foreground transition-all"
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
          </details>
        </div>
      </main>
    </div>
  )
}

