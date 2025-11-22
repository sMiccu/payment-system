"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  last_name: z.string().min(1, "姓を入力してください"),
  first_name: z.string().min(1, "名を入力してください"),
  last_name_kana: z.string().min(1, "セイを入力してください"),
  first_name_kana: z.string().min(1, "メイを入力してください"),
  countryCode: z.string().regex(/^\+\d+$/, "国番号を選択してください"),
  phone_number: z
    .string()
    .min(6, "電話番号を入力してください")
    .regex(/^[0-9\\-\\s()]+$/, "数字と一部の区切り記号(- 空白 ())のみ使用できます"),
}).superRefine((v, ctx) => {
  const digits = v.phone_number.replace(/[^0-9]/g, "");
  if (v.countryCode === "+81") {
    if (!(digits.length === 10 || digits.length === 11)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone_number"],
        message: "日本の番号は10〜11桁で入力してください",
      });
    }
  } else {
    if (digits.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone_number"],
        message: "電話番号の桁数が不足しています",
      });
    }
  }
});

type FormValues = z.infer<typeof schema>;

const MembershipRegisterPage: NextPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      last_name: "",
      first_name: "",
      last_name_kana: "",
      first_name_kana: "",
      countryCode: "+81",
      phone_number: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError("");
    setIsSubmitting(true);
    try {
      // E.164へ整形：国番号 + 国内番号（JPは先頭0を除去）
      const rawDigits = values.phone_number.replace(/[^0-9]/g, "");
      const codeDigits = values.countryCode.replace("+", "");
      const nationalDigits =
        values.countryCode === "+81" && rawDigits.startsWith("0")
          ? rawDigits.slice(1)
          : rawDigits;
      const fullNumber = `+${codeDigits}${nationalDigits}`;

      await apiFetch("/customer/api/membership/", {
        method: "POST",
        body: JSON.stringify({
          last_name: values.last_name,
          first_name: values.first_name,
          last_name_kana: values.last_name_kana,
          first_name_kana: values.first_name_kana,
          phone_number: fullNumber,
        }),
      });
      router.push("/top");
    } catch {
      setError("会員登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <Button className="mb-6" variant="outline" onClick={() => router.push("/top")}>
            ← 戻る
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>会員登録</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>姓</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 田中" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>名</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 太郎" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name_kana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>セイ</FormLabel>
                        <FormControl>
                          <Input placeholder="例: タナカ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="first_name_kana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メイ</FormLabel>
                        <FormControl>
                          <Input placeholder="例: タロウ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormLabel>国番号</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              aria-label="国番号"
                              className="w-full border rounded px-2 py-2"
                            >
                              <option value="+81">+81</option>
                              <option value="+1">+1</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>電話番号</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="例: 08012345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "登録中..." : "登録"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MembershipRegisterPage;

