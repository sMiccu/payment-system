"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { AppSidebar } from "../../components/layout/sidebar";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

const menuSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください"),
  price: z.number().min(0, "価格は0以上で入力してください"), // string -> number に変換
  category_id: z.number().int().nonnegative().nullable().optional(), // 未選択は null/undefined
})

type MenuForm = z.infer<typeof menuSchema>

export default function MenuFormPage() {
  const { control, handleSubmit, reset } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
  })
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    const run = async () => {
      try {
        const list = await apiFetch<Array<{ id: number; name: string }>>("/menu/api/category/");
        setCategories(list);
      } catch (e) {
        // 取得失敗時もフォーム自体は使える（未分類扱い）
        setCategories([]);
      }
    };
    run();
  }, [])

  const onSubmit = async (data: MenuForm) => {
    try {
      await apiFetch("/menu/api/menu/", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          // 未選択（undefined）は送らない。null はそのまま送ってもOK（サーバ側で未分類へ）。
          category_id: data.category_id ?? undefined,
        }),
      })
      alert("登録できたよ！✅")
      reset()
    } catch (err) {
      alert(err)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4">メニュー登録</h1>
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
        </div>
      </main>
    </div>
  )
}