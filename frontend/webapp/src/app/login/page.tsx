"use client";
import { apiFetch } from "@/lib/api";
import type { NextPage } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

 import { z } from "zod";
 import { zodResolver } from "@hookform/resolvers/zod";

  const loginSchema = z.object({
   username: z.string().min(1, "ユーザー名を入力してください"),
   password: z.string().min(1, "パスワードを入力してください"),
 });
 type LoginForm = z.infer<typeof loginSchema>;

const Page: NextPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginForm) {
    setError("");
    try {
      await apiFetch("/login/", {
        method: "POST",
        body: JSON.stringify(values),
      });
      // トークンはHttpOnly Cookieに入るのでlocalStorageは不要
      router.push("/top");
    } catch (e) {
      setError("ユーザー名またはパスワードが間違っています");
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center",
        "bg-gradient-to-t from-neutral-300 via-neutral-200 to-neutral-100",
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>ログイン</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ユーザー名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              {error && <p className="text-red-500 text-sm truncate">{error}</p>}
              <Button className="w-full">ログイン</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default Page;