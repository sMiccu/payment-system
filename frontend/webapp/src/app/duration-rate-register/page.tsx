"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppSidebar } from "../../components/layout/sidebar"
import { apiFetch } from "@/lib/api"
import { useEffect, useState } from "react"

const schema = z.object({
  minutes: z.number().min(0, "0以上で入力してください"),
  membership_price: z.number().int("整数で入力してください").min(0, "0以上で入力してください"),
  general_price: z.number().int("整数で入力してください").min(0, "0以上で入力してください"),
})

type DurationRateForm = z.infer<typeof schema>

export default function DurationRateRegisterPage() {
  const { control, handleSubmit, reset } = useForm<DurationRateForm>({
    resolver: zodResolver(schema),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toDisplayValue = (v: unknown) => (v === undefined || v === null ? "" : String(v))
  type DurationRateItem = { id: number; minutes: number; membership_price: number; general_price: number }
  const [rates, setRates] = useState<Array<DurationRateItem>>([])
  const [loadingRates, setLoadingRates] = useState<boolean>(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<{ minutes: number | undefined; membership_price: number | undefined; general_price: number | undefined }>({
    minutes: undefined,
    membership_price: undefined,
    general_price: undefined,
  })

  const fetchRates = async () => {
    setLoadingRates(true)
    try {
      const list = await apiFetch<Array<{ id: number; minutes: string | number; membership_price: number; general_price: number }>>(
        "/control/api/duration_rate/"
      )
      const mapped: DurationRateItem[] = (list || []).map((r) => ({
        id: r.id,
        minutes: typeof r.minutes === "string" ? Number(r.minutes) : r.minutes,
        membership_price: r.membership_price,
        general_price: r.general_price,
      }))
      setRates(mapped.sort((a, b) => a.minutes - b.minutes))
    } catch {
      setRates([])
    } finally {
      setLoadingRates(false)
    }
  }

  useEffect(() => {
    fetchRates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: DurationRateForm) => {
    setError(null)
    setSubmitting(true)
    try {
      await apiFetch("/control/api/duration_rate/", {
        method: "POST",
        body: JSON.stringify(values),
      })
      alert("時間料金を登録しました ✅")
      reset()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "登録に失敗しました"
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-foreground">時間料金管理</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* 左側：時間料金登録 */}
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
            <div>
              <label className="block text-sm text-muted-foreground mb-1">経過時間（分）</label>
              <Controller
                name="minutes"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      inputMode="numeric"
                      className="border border-border/50 bg-input/50 text-foreground p-2 w-full rounded"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={toDisplayValue(field.value)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          field.onChange(undefined);
                        } else {
                          const n = Number.parseInt(v, 10);
                          field.onChange(Number.isNaN(n) ? undefined : n);
                        }
                      }}
                      placeholder="例: 30"
                    />
                    {fieldState.error && (
                      <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">会員価格（税抜）</label>
              <Controller
                name="membership_price"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      inputMode="numeric"
                      className="border border-border/50 bg-input/50 text-foreground p-2 w-full rounded"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={toDisplayValue(field.value)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          field.onChange(undefined);
                        } else {
                          const n = Number.parseInt(v, 10);
                          field.onChange(Number.isNaN(n) ? undefined : n);
                        }
                      }}
                      placeholder="例: 500"
                    />
                    {fieldState.error && (
                      <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">非会員価格（税抜）</label>
              <Controller
                name="general_price"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      inputMode="numeric"
                      className="border border-border/50 bg-input/50 text-foreground p-2 w-full rounded"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={toDisplayValue(field.value)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          field.onChange(undefined);
                        } else {
                          const n = Number.parseInt(v, 10);
                          field.onChange(Number.isNaN(n) ? undefined : n);
                        }
                      }}
                      placeholder="例: 700"
                    />
                    {fieldState.error && (
                      <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white p-2.5 rounded-lg font-medium shadow-md disabled:opacity-60"
            >
              {submitting ? "登録中..." : "登録"}
            </button>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </form>
          </div>

          {/* 真ん中：時間料金一覧 */}
          <div className="bg-surface-elevated border border-border/50 rounded-xl p-6 shadow-sm flex flex-col overflow-hidden">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  一覧
                </h2>
                {!loadingRates && (
                  <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-semibold rounded-full text-sm">
                    {rates.length} 件
                  </span>
                )}
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-transparent rounded-full opacity-30"></div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              {loadingRates && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary"></div>
                    <p className="text-sm text-muted-foreground">読み込み中...</p>
                  </div>
                </div>
              )}
              {!loadingRates && rates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-base text-muted-foreground mb-1">料金データがありません</p>
                  <p className="text-sm text-muted-foreground/70">上のフォームから新しい時間料金を追加してください</p>
                </div>
              )}
              {!loadingRates && rates.length > 0 && (
                <div className="grid gap-3">
                  {rates.map((r, idx) => (
                    <div
                      key={r.id}
                      className="bg-surface-elevated border border-border/50 rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-slide-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {editId === r.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-muted-foreground">経過時間（分）</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                type="number"
                                step="1"
                                min="0"
                                inputMode="numeric"
                                value={toDisplayValue(edit.minutes)}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (v === "") {
                                    setEdit((prev) => ({ ...prev, minutes: undefined }))
                                  } else {
                                    const n = Number.parseInt(v, 10)
                                    setEdit((prev) => ({ ...prev, minutes: Number.isNaN(n) ? undefined : n }))
                                  }
                                }}
                                placeholder="分"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-muted-foreground">会員価格</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                type="number"
                                step="1"
                                min="0"
                                inputMode="numeric"
                                value={toDisplayValue(edit.membership_price)}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (v === "") {
                                    setEdit((prev) => ({ ...prev, membership_price: undefined }))
                                  } else {
                                    const n = Number.parseInt(v, 10)
                                    setEdit((prev) => ({ ...prev, membership_price: Number.isNaN(n) ? undefined : n }))
                                  }
                                }}
                                placeholder="会員"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-muted-foreground">非会員価格</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                type="number"
                                step="1"
                                min="0"
                                inputMode="numeric"
                                value={toDisplayValue(edit.general_price)}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (v === "") {
                                    setEdit((prev) => ({ ...prev, general_price: undefined }))
                                  } else {
                                    const n = Number.parseInt(v, 10)
                                    setEdit((prev) => ({ ...prev, general_price: Number.isNaN(n) ? undefined : n }))
                                  }
                                }}
                                placeholder="非会員"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditId(null)
                              }}
                              className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-foreground transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  edit.minutes === undefined ||
                                  edit.membership_price === undefined ||
                                  edit.general_price === undefined
                                ) {
                                  alert("すべての値を入力してください")
                                  return
                                }
                                try {
                                  await apiFetch(`/control/api/duration_rate/${r.id}/`, {
                                    method: "PATCH",
                                    body: JSON.stringify({
                                      minutes: edit.minutes,
                                      membership_price: edit.membership_price,
                                      general_price: edit.general_price,
                                    }),
                                  })
                                  setEditId(null)
                                  await fetchRates()
                                  alert("時間料金を更新しました ✅")
                                } catch (e) {
                                  alert(e)
                                }
                              }}
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
                              <div className="text-xs text-muted-foreground mb-1 font-medium">経過時間</div>
                              <div className="text-xl font-bold text-foreground tabular-nums flex items-baseline gap-1">
                                {r.minutes}
                                <span className="text-sm text-muted-foreground font-medium">分</span>
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-3 border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">会員価格</div>
                              <div className="text-xl font-bold text-primary tabular-nums">¥{r.membership_price.toLocaleString()}</div>
                            </div>
                            <div className="bg-gradient-to-br from-secondary/5 to-transparent rounded-lg p-3 border border-secondary/20">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">非会員価格</div>
                              <div className="text-xl font-bold text-secondary tabular-nums">¥{r.general_price.toLocaleString()}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(r.id)
                              setEdit({
                                minutes: r.minutes,
                                membership_price: r.membership_price,
                                general_price: r.general_price,
                              })
                            }}
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

          {/* 右側：空 */}
          <div className="hidden lg:block">
            {/* 将来的に機能を追加する場合はここに配置 */}
          </div>
        </div>
      </main>
    </div>
  )
}



