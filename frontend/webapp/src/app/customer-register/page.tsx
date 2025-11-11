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

// 顧客登録フォームのスキーマ
const customerSchema = z.object({
  name: z.string().min(1, "顧客名を入力してください"),
});

type CustomerForm = z.infer<typeof customerSchema>;

const CustomerRegisterPage: NextPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: CustomerForm) {
    setError("");
    setIsSubmitting(true);
    try {
      // 顧客登録APIを呼び出す
      await apiFetch("/customer/api/customer/", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          start_datetime: new Date().toISOString(),
        }),
      });
      
      // 登録成功後、トップページに戻る
      router.push("/top");
    } catch (e) {
      setError("顧客登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <Button
            className="mb-6"
            variant="outline"
            onClick={() => router.push("/top")}
          >
            ← 戻る
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>来店登録</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>顧客名</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 田中 太郎" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button 
                    className="w-full" 
                    type="submit"
                    disabled={isSubmitting}
                  >
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

export default CustomerRegisterPage;