"use client"
 
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useToast } from "@/components/layout/ToastProvider";

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { showToast } = useToast();

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
      setIsModalOpen(false)
      showToast("カテゴリを登録しました ✅", "success")
    } catch (e: unknown) {
      console.error("Failed to create category:", e);
      showToast(
        "カテゴリの登録に失敗しました。もう一度お試しください。",
        "error",
      );
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
      showToast("カテゴリを更新しました ✅", "success")
    } catch (e: unknown) {
      console.error("Failed to update category:", e);
      showToast(
        "カテゴリの更新に失敗しました。もう一度お試しください。",
        "error",
      );
    } finally {
      setCategorySavingId(null)
    }
  }

  const cancelEditCategory = () => {
    setCategoryEditId(null)
    setCategoryEditName("")
  }

  return (
    <>
      <div className="max-w-6xl mx-auto pb-24">
        {/* カテゴリー登録ボタン */}
        <div className="mb-8 animate-slide-in-up">
            <Button
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 text-white font-medium text-base px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-primary/50"
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              カテゴリー登録
            </Button>
        </div>

          {/* カテゴリー一覧 */}
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-foreground animate-slide-in-left">一覧</h2>
            {isLoadingCategories ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-20 surface-elevated rounded-lg border border-border/50 animate-pulse"
                  >
                    <div className="h-full p-4 flex items-center gap-4">
                      <div className="h-4 bg-muted/30 rounded w-1/4 animate-shimmer"></div>
                      <div className="ml-auto flex gap-2">
                        <div className="h-8 w-16 bg-muted/30 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground animate-fade-in">
                カテゴリーがありません
              </div>
            ) : (
              categories.map((c, index) => (
                <div 
                  key={c.id} 
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="surface-elevated rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group"
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
                          <Button
                            type="button"
                            onClick={cancelEditCategory}
                            variant="secondary"
                            className="font-medium rounded-lg px-6"
                          >
                            キャンセル
                          </Button>
                          <Button
                            type="button"
                            onClick={() => saveEditCategory(c.id)}
                            disabled={categorySavingId === c.id}
                            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium rounded-lg px-6"
                          >
                            {categorySavingId === c.id ? "保存中..." : "保存"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-4">
                          <span className="text-foreground font-medium group-hover:text-primary transition-colors	duration-200">
                            {c.name}
                          </span>
                          {isUncategorized(c) && (
                            <span className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs font-medium">
                              システム
                            </span>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          className="font-medium rounded-lg px-6"
                          onClick={() => startEditCategory(c)}
                          disabled={isUncategorized(c)}
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-background border border-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">カテゴリー登録</h2>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isCreatingCategory) handleCreateCategory();
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">カテゴリー名</label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="カテゴリ名"
                  className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg"
                />
              </div>
              {categoryError && <div className="text-sm text-destructive">{categoryError}</div>}
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
                  disabled={isCreatingCategory}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium rounded-lg px-6"
                >
                  {isCreatingCategory ? "登録中..." : "登録"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


