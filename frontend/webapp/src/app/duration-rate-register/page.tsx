"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppSidebar } from "../../components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { useEffect, useState } from "react"

const schema = z.object({
  minutes: z.number().min(0, "0以上で入力してください"),
  membership_price: z.number().int("整数で入力してください").min(0, "0以上で入力してください"),
  general_price: z.number().int("整数で入力してください").min(0, "0以上で入力してください"),
})

type DurationRateForm = z.infer<typeof schema>
type DurationRateItem = { id: number; minutes: number; membership_price: number; general_price: number }

export default function DurationRateRegisterPage() {
  const { control, handleSubmit, reset } = useForm<DurationRateForm>({
    resolver: zodResolver(schema),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toDisplayValue = (v: unknown) => (v === undefined || v === null ? "" : String(v))
  const [rates, setRates] = useState<Array<DurationRateItem>>([])
  const [loadingRates, setLoadingRates] = useState<boolean>(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<{ minutes: number | undefined; membership_price: number | undefined; general_price: number | undefined }>({
    minutes: undefined,
    membership_price: undefined,
    general_price: undefined,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setIsModalOpen(false)
      await fetchRates()
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
        <div className="max-w-6xl mx-auto pb-24">
          {/* 時間料金登録ボタン */}
          <div className="mb-8 animate-slide-in-up">
            <Button
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 text-white font-medium text-base px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-primary/50"
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              時間料金登録
            </Button>
          </div>

          {/* 時間料金一覧 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-foreground animate-slide-in-left">一覧</h2>
            {loadingRates ? (
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
            ) : rates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground animate-fade-in">
                料金データがありません
              </div>
            ) : (
              rates.map((r, index) => (
                <div 
                  key={r.id} 
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="surface-elevated rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group"
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
                          <Button
                            type="button"
                            onClick={() => {
                              setEditId(null)
                            }}
                            variant="secondary"
                            className="font-medium rounded-lg px-6"
                          >
                            キャンセル
                          </Button>
                          <Button
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
                            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium rounded-lg px-6"
                          >
                            保存
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">経過時間</span>
                            <span className="text-foreground font-bold group-hover:text-primary transition-colors duration-200">
                              {r.minutes} 分
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">会員</span>
                            <span className="text-primary font-bold text-lg">
                              ¥{r.membership_price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">非会員</span>
                            <span className="text-secondary font-bold text-lg">
                              ¥{r.general_price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          className="font-medium rounded-lg px-6"
                          onClick={() => {
                            setEditId(r.id)
                            setEdit({
                              minutes: r.minutes,
                              membership_price: r.membership_price,
                              general_price: r.general_price,
                            })
                          }}
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
                <h2 className="text-2xl font-bold text-foreground">時間料金登録</h2>
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
                  <label className="block text-sm font-medium text-muted-foreground mb-1">経過時間（分）</label>
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
                          className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg"
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
                  <label className="block text-sm font-medium text-muted-foreground mb-1">会員価格（税抜）</label>
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
                          className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg"
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
                  <label className="block text-sm font-medium text-muted-foreground mb-1">非会員価格（税抜）</label>
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
                          className="w-full border border-border/50 bg-input/50 text-foreground p-2 rounded-lg"
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

                {error && <div className="text-sm text-destructive">{error}</div>}
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
                    disabled={submitting}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium rounded-lg px-6"
                  >
                    {submitting ? "登録中..." : "登録"}
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
