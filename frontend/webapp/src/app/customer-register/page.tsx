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

// 顧客登録フォームのスキーマ（電話番号は任意：検索用）
const customerSchema = z
  .object({
    name: z.string().min(1, "顧客名を入力してください"),
    countryCode: z.string().regex(/^\+\d+$/, "国番号を選択してください").optional(),
    phone_number: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.phone_number) return;
    const allowed = /^[0-9\-\s()]+$/;
    if (!allowed.test(v.phone_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone_number"],
        message: "数字と一部の区切り記号(- 空白 ())のみ使用できます",
      });
      return;
    }
    const digits = v.phone_number.replace(/[^0-9]/g, "");
    const cc = v.countryCode ?? "+81";
    if (cc === "+81") {
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

type CustomerForm = z.infer<typeof customerSchema>;

const CustomerRegisterPage: NextPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [memberships, setMemberships] = useState<
    { id: number; first_name: string; last_name: string; phone_number?: string }[]
  >([]);
  const [selectedMembershipId, setSelectedMembershipId] = useState<number | null>(null);

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      countryCode: "+81",
      phone_number: "",
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
          membership: selectedMembershipId,
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

  function toE164(countryCode: string, national: string) {
    const rawDigits = national.replace(/[^0-9]/g, "");
    const codeDigits = countryCode.replace("+", "");
    const nationalDigits =
      countryCode === "+81" && rawDigits.startsWith("0") ? rawDigits.slice(1) : rawDigits;
    if (!nationalDigits) return "";
    return `+${codeDigits}${nationalDigits}`;
  }

  async function handleSearch() {
    setSearchError("");
    setIsSearching(true);
    setMemberships([]);
    setSelectedMembershipId(null);
    try {
      const values = form.getValues();
      const cc = values.countryCode ?? "+81";
      const num = values.phone_number ?? "";
      if (!num.trim()) {
        setSearchError("電話番号を入力してください");
        return;
      }
      const e164 = toE164(cc, num);
      if (!e164) {
        setSearchError("有効な電話番号を入力してください");
        return;
      }
      const res = await apiFetch<any>(`/customer/api/membership/?phone_number=${encodeURIComponent(e164)}`);
      const list = Array.isArray(res) ? res : (res?.results ?? []);
      setMemberships(list);
      if (list.length === 0) {
        setSearchError("該当する会員が見つかりませんでした");
      }
    } catch {
      setSearchError("会員検索に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelect(m: { id: number; first_name: string; last_name: string }) {
    setSelectedMembershipId(m.id);
    form.setValue("name", `${m.last_name} ${m.first_name}`, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <div className="flex h-screen bg-background">
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

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground">来店登録</CardTitle>
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
                          <Input 
                            placeholder="例: 田中 太郎" 
                            {...field} 
                            className="bg-input/50 border-border/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
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
                                className="w-full border border-border/50 bg-input/50 text-foreground rounded px-2 py-2"
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
                            <FormLabel>電話番号（検索用）</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="例: 08012345678" 
                                {...field} 
                                className="bg-input/50 border-border/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        onClick={handleSearch} 
                        disabled={isSearching}
                        variant="secondary"
                      >
                        {isSearching ? "検索中..." : "会員検索"}
                      </Button>
                    </div>
                    {searchError && <p className="text-destructive text-sm">{searchError}</p>}
                    {memberships.length > 0 && (
                      <div className="border border-border/50 bg-muted/30 rounded p-3 space-y-2">
                        {memberships.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-2 bg-card/50 rounded">
                            <div className="text-sm">
                              <div className="text-foreground">{m.last_name} {m.first_name}</div>
                              {m.phone_number && <div className="text-muted-foreground">{m.phone_number}</div>}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={selectedMembershipId === m.id ? "default" : "secondary"}
                              onClick={() => handleSelect(m)}
                            >
                              {selectedMembershipId === m.id ? "選択中" : "選択"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 mt-6">
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" 
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