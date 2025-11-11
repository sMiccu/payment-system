"use client";

import type { NextPage } from "next";
import { AppSidebar } from "../../components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

// APIから取得する顧客データの型定義
type CustomerApiResponse = {
  id: number;
  name: string;
  start_datetime: string | null;
  end_datetime: string | null;
  total_amount: string;
  paid: boolean;
  membership: number | null;
};

// 表示用の顧客データの型定義
type Customer = {
  id: string;
  name: string;
  startTime: string;
};

// start_datetimeから時刻を抽出する関数
const extractTime = (datetime: string | null): string => {
  if (!datetime) return "--:--";
  const date = new Date(datetime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const Page: NextPage = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // APIから顧客データを取得
        const data: CustomerApiResponse[] = await apiFetch<CustomerApiResponse[]>(
          "/customer/api/customer/"
        );
        
        // 来店中の顧客のみをフィルタリング（end_datetimeがnullのもの）
        const activeCustomers = data.filter(
          (customer) => customer.end_datetime === null
        );
        
        // 表示用の形式に変換
        const formattedCustomers: Customer[] = activeCustomers.map(
          (customer) => ({
            id: customer.id.toString(),
            name: customer.name,
            startTime: extractTime(customer.start_datetime),
          })
        );
        
        setCustomers(formattedCustomers);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "不明なエラーが発生しました";
        setError(`顧客データの取得に失敗しました: ${errorMessage}`);
        console.error("Failed to fetch customers:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">
                読み込み中...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                {error}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                来店中の顧客はいません
              </div>
            ) : (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-gray-100 rounded-lg p-4 flex items-center justify-between shadow-sm mb-3"
                >
                  <div className="flex-1 font-medium text-gray-800">{customer.name}</div>
                  <div className="flex-1 text-gray-600">開始: {customer.startTime}</div>
                  <div className="flex space-x-4">
                    <Button
                      className="bg-green-400 hover:bg-green-500 text-black font-medium rounded-lg px-6 border border-gray-200"
                      onClick={() => router.push(`/order?customerId=${customer.id}`)}
                    >
                      注文
                    </Button>
                    <Button
                      className="bg-red-300 hover:bg-red-400 text-white font-medium rounded-lg px-6 border border-gray-200"
                      onClick={() => router.push(`/payment?customerId=${customer.id}`)}
                    >
                      会計
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
