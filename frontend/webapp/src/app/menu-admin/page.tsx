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
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4">メニュー管理</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input {...field} placeholder="メニュー名" className="border p-2" />
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <input {...field} type="number" placeholder="価格" className="border p-2" value={field.value || ""} onChange={e => field.onChange(e.target.valueAsNumber)}/>
              )}
            />
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <select
                  className="border p-2"
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
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
              登録
            </button>
          </form>

          <details className="mt-8">
            <summary className="cursor-pointer select-none text-base font-medium">メニュー一覧</summary>
            <div className="mt-3 flex flex-col gap-2">
              {isLoadingMenus && <div className="text-sm text-gray-600">読み込み中...</div>}
              {!isLoadingMenus && menus.length === 0 && (
                <div className="text-sm text-gray-600">メニューがありません。</div>
              )}
              {!isLoadingMenus && menus.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {menus.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      {menuEditId === m.id ? (
                        <>
                          <input
                            className="border p-1 flex-1"
                            value={menuEdit.name}
                            onChange={(e) => setMenuEdit({ ...menuEdit, name: e.target.value })}
                            placeholder="メニュー名"
                          />
                          <input
                            type="number"
                            className="border p-1 w-28"
                            value={Number.isFinite(menuEdit.price) ? menuEdit.price : 0}
                            onChange={(e) => setMenuEdit({ ...menuEdit, price: e.target.valueAsNumber })}
                            placeholder="価格"
                          />
                          <select
                            className="border p-1"
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
                          <button
                            type="button"
                            onClick={() => saveEditMenu(m.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditMenu}
                            className="px-2 py-1 border rounded"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1">{m.name}</span>
                          <span className="w-24 text-right">{m.price}</span>
                          <span className="w-28 text-center">{m.category_name || "未分類"}</span>
                          <button
                            type="button"
                            onClick={() => startEditMenu(m)}
                            className="px-2 py-1 border rounded"
                          >
                            編集
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </div>
      </main>
    </div>
  )
}

