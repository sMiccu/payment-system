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
          <details className="mt-8">
            <summary className="cursor-pointer select-none text-base font-medium text-foreground">時間料金一覧</summary>
            <div className="mt-3 flex flex-col gap-2">
              {loadingRates && <div className="text-sm text-muted-foreground">読み込み中...</div>}
              {!loadingRates && rates.length === 0 && <div className="text-sm text-muted-foreground">データがありません。</div>}
              {!loadingRates && rates.length > 0 && (
                <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <span className="w-24 text-right">経過時間</span>
                  <span className="w-28 text-right">会員価格</span>
                  <span className="w-28 text-right">非会員価格</span>
                  <span className="flex-1" />
                </div>
                <ul className="flex flex-col gap-2">
                  {rates.map((r) => (
                    <li key={r.id} className="flex items-center gap-2">
                      {editId === r.id ? (
                        <>
                          <input
                            className="border border-border/50 bg-input/50 text-foreground p-1 w-24 rounded"
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
                          <input
                            className="border border-border/50 bg-input/50 text-foreground p-1 w-28 rounded"
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
                          <input
                            className="border border-border/50 bg-input/50 text-foreground p-1 w-28 rounded"
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
                            className="px-2 py-1 bg-primary hover:bg-primary/90 text-white rounded"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(null)
                            }}
                            className="px-2 py-1 border border-border hover:bg-muted rounded text-foreground"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="w-24 text-right tabular-nums text-foreground">{r.minutes} 分</span>
                          <span className="w-28 text-right tabular-nums text-foreground">{r.membership_price} 円</span>
                          <span className="w-28 text-right tabular-nums text-foreground">{r.general_price} 円</span>
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
                            className="px-2 py-1 border border-border hover:bg-muted rounded text-foreground"
                          >
                            編集
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                </>
              )}
            </div>
          </details>
        </div>
      </main>
    </div>
  )
}



