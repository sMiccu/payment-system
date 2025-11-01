"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod";

const menuSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください"),
  price: z.number().min(0, "価格は0以上で入力してください"), // string -> number に変換
})

type MenuForm = z.infer<typeof menuSchema>

export default function MenuFormPage() {
  const { control, handleSubmit, reset } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
  })

  const onSubmit = async (data: MenuForm) => {
    try {
      const res = await fetch("http://localhost:8000/menu/api/menu/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("登録に失敗しました")
      alert("登録できたよ！✅")
      reset()
    } catch (err) {
      alert(err)
    }
  }

  return (
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
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        登録
      </button>
    </form>
  )
}