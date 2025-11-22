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
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4 text-foreground">時間料金管理</h1>
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
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white p-2 rounded disabled:opacity-60"
            >
              {submitting ? "登録中..." : "登録"}
            </button>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </form>
          <details className="mt-8" open>
            <summary className="cursor-pointer select-none text-base font-medium text-foreground mb-4">時間料金一覧</summary>
            <div className="mt-3 flex flex-col gap-3">
              {loadingRates && <div className="text-sm text-muted-foreground">読み込み中...</div>}
              {!loadingRates && rates.length === 0 && <div className="text-sm text-muted-foreground">データがありません。</div>}
              {!loadingRates && rates.length > 0 && (
                <div className="grid gap-3">
                  {rates.map((r, idx) => (
                    <div
                      key={r.id}
                      className="bg-surface-elevated border border-border/50 rounded-lg p-4 hover:border-primary/30 transition-all duration-300 animate-slide-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {editId === r.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-muted-foreground">経過時間（分）</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
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
                              <label className="text-xs text-muted-foreground">会員価格</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
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
                              <label className="text-xs text-muted-foreground">非会員価格</label>
                              <input
                                className="border border-border/50 bg-input/50 text-foreground px-3 py-2 rounded"
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
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditId(null)
                              }}
                              className="px-4 py-2 border border-border hover:bg-muted rounded text-foreground transition-colors"
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
                              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded transition-opacity"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">経過時間</div>
                              <div className="text-lg font-semibold text-foreground tabular-nums">{r.minutes} 分</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">会員価格</div>
                              <div className="text-lg font-semibold text-primary tabular-nums">¥{r.membership_price.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">非会員価格</div>
                              <div className="text-lg font-semibold text-secondary tabular-nums">¥{r.general_price.toLocaleString()}</div>
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
                            className="px-4 py-2 border border-border hover:bg-muted hover:border-primary/50 rounded text-foreground transition-all ml-4"
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



