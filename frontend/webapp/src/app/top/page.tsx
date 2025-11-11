"use client";

import type { NextPage } from "next";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

// 顧客データの型定義
type Customer = {
  id: string;
  name: string;
  startTime: string;
};

// サンプルデータ
const sampleCustomers: Customer[] = [
  { id: "1", name: "田中 太郎", startTime: "10:30" },
  { id: "2", name: "佐藤 花子", startTime: "11:15" },
  { id: "3", name: "鈴木 一郎", startTime: "12:00" },
  { id: "4", name: "山田 優子", startTime: "13:45" },
];

const Page: NextPage = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* 来店登録ボタン */}
          <div className="mb-8">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-base px-8 py-6 h-auto shadow-md"
              size="lg"
              onClick={() => router.push("/customer-register")}
            >
              来店登録
            </Button>
          </div>

          {/* 顧客リスト */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">来店中のお客様</h2>
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-gray-100 rounded-lg p-4 flex items-center justify-between shadow-sm mb-3"
              >
                <div className="flex-1 font-medium text-gray-800">{customer.name}</div>
                <div className="flex-1 text-gray-600">開始: {customer.startTime}</div>
                <div className="flex space-x-4">
                  <Button
                    className="bg-green-400 hover:bg-green-500 text-black font-medium rounded-lg px-6 border border-gray-200"
                  >
                    注文
                  </Button>
                  <Button
                    className="bg-red-300 hover:bg-red-400 text-white font-medium rounded-lg px-6 border border-gray-200"
                  >
                    会計
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
