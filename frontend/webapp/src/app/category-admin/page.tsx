"use client"

import { AppSidebar } from "../../components/layout/sidebar";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type Category = { id: number; name: string }

export default function CategoryAdminPage() {
  const [categories, setCategories] = useState<Array<Category>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categoryEditId, setCategoryEditId] = useState<number | null>(null)
  const [categoryEditName, setCategoryEditName] = useState("")
  const [categorySavingId, setCategorySavingId] = useState<number | null>(null)

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const list = await apiFetch<Array<Category>>("/menu/api/category/");
      setCategories(list);
    } catch {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreateCategory = async () => {
    setCategoryError(null)
    const name = newCategoryName.trim()
    if (!name) {
      setCategoryError("カテゴリ名を入力してください")
      return
    }
    try {
      setIsCreatingCategory(true)
      const created = await apiFetch<Category>("/menu/api/category/", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
      setCategories((prev) => {
        const next = [...prev, created].sort((a, b) => a.id - b.id)
        return next
      })
      setNewCategoryName("")
      alert("カテゴリを登録しました ✅")
    } catch (err) {
      alert(err)
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const isUncategorized = (c: Category) => c.name === "未分類"

  const startEditCategory = (c: Category) => {
    if (isUncategorized(c)) return
    setCategoryEditId(c.id)
    setCategoryEditName(c.name)
  }

  const saveEditCategory = async (id: number) => {
    const name = categoryEditName.trim()
    if (!name) {
      setCategoryError("カテゴリ名を入力してください")
      return
    }
    try {
      setCategorySavingId(id)
      const updated = await apiFetch<Category>(`/menu/api/category/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      })
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setCategoryEditId(null)
      setCategoryEditName("")
      alert("カテゴリを更新しました ✅")
    } catch (err) {
      alert(err)
    } finally {
      setCategorySavingId(null)
    }
  }

  const cancelEditCategory = () => {
    setCategoryEditId(null)
    setCategoryEditName("")
  }

  // 削除機能は無効化（ボタン/ロジックを削除）

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4">カテゴリー管理</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!isCreatingCategory) handleCreateCategory()
            }}
            className="flex flex-col gap-4"
          >
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="カテゴリ名"
              className="border p-2"
            />
            <button
              type="submit"
              disabled={isCreatingCategory}
              className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
            >
              登録
            </button>
            {categoryError && <div className="text-sm text-red-600">{categoryError}</div>}
          </form>

          <details className="mt-8">
            <summary className="cursor-pointer select-none text-base font-medium">カテゴリー一覧</summary>
            <div className="mt-3 flex flex-col gap-2">
              {isLoadingCategories && <div className="text-sm text-gray-600">読み込み中...</div>}
              {!isLoadingCategories && categories.length === 0 && (
                <div className="text-sm text-gray-600">カテゴリがありません。</div>
              )}
              {!isLoadingCategories && categories.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {categories.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      {categoryEditId === c.id ? (
                        <>
                          <input
                            className="border p-1 flex-1"
                            value={categoryEditName}
                            onChange={(e) => setCategoryEditName(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => saveEditCategory(c.id)}
                            disabled={categorySavingId === c.id}
                            className="px-2 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditCategory}
                            className="px-2 py-1 border rounded"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => startEditCategory(c)}
                            disabled={isUncategorized(c)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
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

