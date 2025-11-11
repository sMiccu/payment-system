"use client";

import type { NextPage } from "next";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";

const OrderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              className="mb-6"
              variant="outline"
              onClick={() => router.push("/top")}
            >
              ← 戻る
            </Button>
            <h1 className="text-2xl font-semibold mb-4">注文画面</h1>
            {customerId && (
              <p className="text-gray-600">顧客ID: {customerId}</p>
            )}
            <p className="text-gray-500 mt-4">この画面は今後実装予定です。</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const OrderPage: NextPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <OrderContent />
    </Suspense>
  );
};

export default OrderPage;

