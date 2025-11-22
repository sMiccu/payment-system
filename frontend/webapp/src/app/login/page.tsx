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
      await apiFetch("/control/api/login/", {
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
        "bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]",
        "relative overflow-hidden"
      )}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]" />
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10">
          <Card className="w-[400px] glow-card border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ログイン
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                アカウント情報を入力してください
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ユーザー名</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-input/50 border-border/50 focus:border-primary/50 transition-all"
                      />
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
                      <Input 
                        type="password" 
                        {...field} 
                        className="bg-input/50 border-border/50 focus:border-primary/50 transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              {error && <p className="text-destructive text-sm truncate">{error}</p>}
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                ログイン
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default Page;