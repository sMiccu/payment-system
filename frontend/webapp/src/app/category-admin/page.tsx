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
        <h1 className="text-2xl font-bold mb-6 text-foreground">カテゴリー管理</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* 左側：カテゴリー登録 */}
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
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white p-2.5 rounded-lg font-medium shadow-md disabled:opacity-50"
              >
                登録
              </button>
              {categoryError && <div className="text-sm text-destructive">{categoryError}</div>}
            </form>
          </div>

          {/* 真ん中：カテゴリー一覧 */}
          <div className="bg-surface-elevated border border-border/50 rounded-xl p-6 shadow-sm flex flex-col overflow-hidden">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  一覧
                </h2>
                {!isLoadingCategories && (
                  <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-semibold rounded-full text-sm">
                    {categories.length} 件
                  </span>
                )}
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-transparent rounded-full opacity-30"></div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              {isLoadingCategories && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary"></div>
                    <p className="text-sm text-muted-foreground">読み込み中...</p>
                  </div>
                </div>
              )}
              {!isLoadingCategories && categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <p className="text-base text-muted-foreground mb-1">カテゴリーがありません</p>
                  <p className="text-sm text-muted-foreground/70">上のフォームから新しいカテゴリーを追加してください</p>
                </div>
              )}
              {!isLoadingCategories && categories.length > 0 && (
                <div className="grid gap-3">
                  {categories.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`bg-surface-elevated border border-border/50 rounded-xl p-5 transition-all duration-300 animate-slide-in-up ${
                        !isUncategorized(c) ? "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5" : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {categoryEditId === c.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-muted-foreground">カテゴリー名</label>
                            <input
                              className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              value={categoryEditName}
                              onChange={(e) => setCategoryEditName(e.target.value)}
                              placeholder="カテゴリー名"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={cancelEditCategory}
                              className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-foreground transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditCategory(c.id)}
                              disabled={categorySavingId === c.id}
                              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50 shadow-md"
                            >
                              {categorySavingId === c.id ? "保存中..." : "保存"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              {c.name}
                              {isUncategorized(c) && (
                                <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-muted/60 to-muted/40 text-muted-foreground rounded-full font-medium">
                                  システム
                                </span>
                              )}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditCategory(c)}
                            disabled={isUncategorized(c)}
                            className="px-5 py-2.5 border border-border hover:bg-muted hover:border-primary/50 rounded-lg text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium"
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

          {/* 右側：空 */}
          <div className="hidden lg:block">
            {/* 将来的に機能を追加する場合はここに配置 */}
          </div>
        </div>
      </main>
    </div>
  )
}

