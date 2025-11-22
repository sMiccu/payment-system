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
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4 text-foreground">カテゴリー管理</h1>
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
              className="border border-border/50 bg-input/50 text-foreground p-2 rounded"
            />
            <button
              type="submit"
              disabled={isCreatingCategory}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white p-2 rounded disabled:opacity-50"
            >
              登録
            </button>
            {categoryError && <div className="text-sm text-destructive">{categoryError}</div>}
          </form>

          <details className="mt-8" open>
            <summary className="cursor-pointer select-none text-base font-medium text-foreground mb-4">カテゴリー一覧</summary>
            <div className="mt-3 flex flex-col gap-3">
              {isLoadingCategories && <div className="text-sm text-muted-foreground">読み込み中...</div>}
              {!isLoadingCategories && categories.length === 0 && (
                <div className="text-sm text-muted-foreground">カテゴリがありません。</div>
              )}
              {!isLoadingCategories && categories.length > 0 && (
                <div className="grid gap-3">
                  {categories.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`bg-surface-elevated border border-border/50 rounded-lg p-4 transition-all duration-300 animate-slide-in-up ${
                        !isUncategorized(c) ? "hover:border-primary/30" : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {categoryEditId === c.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground">カテゴリー名</label>
                            <input
                              className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
                              value={categoryEditName}
                              onChange={(e) => setCategoryEditName(e.target.value)}
                              placeholder="カテゴリー名"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEditCategory}
                              className="px-4 py-2 border border-border hover:bg-muted rounded text-foreground transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditCategory(c.id)}
                              disabled={categorySavingId === c.id}
                              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded transition-opacity disabled:opacity-50"
                            >
                              {categorySavingId === c.id ? "保存中..." : "保存"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              {c.name}
                              {isUncategorized(c) && (
                                <span className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground rounded">
                                  システム
                                </span>
                              )}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditCategory(c)}
                            disabled={isUncategorized(c)}
                            className="px-4 py-2 border border-border hover:bg-muted hover:border-primary/50 rounded text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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

