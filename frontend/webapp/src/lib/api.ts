export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/';
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',           // ← 重要
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      // 'X-CSRFToken': getCsrfFromCookie(), // CSRFを導入するなら付与
    },
    ...options,
  });
  if (res.status === 401) {
    // 一度だけサイレントrefresh（Cookieに入っているrefreshトークンを使用）
    const refreshRes = await fetch(`${base}control/api/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Cookieのrefreshを使う
    });
    if (refreshRes.ok) {
      // refreshに成功したら、同じリクエストをもう一度実行
      return apiFetch<T>(path, options);
    }
  }
  if (!res.ok) throw new Error(await res.text());
  // 本文なし（204/205や空ボディ）を安全に扱う
  if (res.status === 204 || res.status === 205) {
    return undefined as unknown as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    // JSONでないレスポンス（不要なケース）はundefinedとして返す
    return undefined as unknown as T;
  }
}

export type QuoteBreakdownRow = {
  minutes: string;       // Decimal 文字列
  count: number;
  unit_price: string;    // Decimal 文字列
  line_total: string;    // Decimal 文字列
};

export type CustomerQuoteResponse = {
  played_minutes: string; // Decimal 文字列
  subtotal: string;       // Decimal 文字列
  breakdown: QuoteBreakdownRow[];
};

export async function fetchCustomerQuote(customerId: string, params?: { start_dt?: string; end_dt?: string; }): Promise<CustomerQuoteResponse> {
  const search = new URLSearchParams();
  if (params?.start_dt) search.set('start_dt', params.start_dt);
  if (params?.end_dt) search.set('end_dt', params.end_dt);
  const query = search.toString();
  const path = query
    ? `customer/api/customer/${encodeURIComponent(customerId)}/quote/?${query}`
    : `customer/api/customer/${encodeURIComponent(customerId)}/quote/`;
  return apiFetch<CustomerQuoteResponse>(path);
}

// ====== Menu & Order for Payment Page ======
export type MenuItem = {
  id: number;
  name: string;
  price: number; // 円（整数）
  category_name: string;
};

export async function fetchMenus(): Promise<MenuItem[]> {
  // 認証ユーザーの店舗のメニュー一覧
  return apiFetch<MenuItem[]>('menu/api/menu/');
}

export type CreateOrderItem = { menu_id: number; quantity: number };
export type CreateOrderResponse = { order_id: number; total_amount: string };

export async function createOrder(payload: { customer_id: number; items: CreateOrderItem[] }): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('order/api/order/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ====== Payment summary & checkout ======
export type PaymentOrderItem = {
  menu_id: number;
  menu_name: string;
  quantity: number;
  line_total: string; // Decimal
};
export type PaymentSummaryResponse = {
  items: PaymentOrderItem[];
  order_total: string; // Decimal
};

export async function fetchCustomerPaymentSummary(customerId: string): Promise<PaymentSummaryResponse> {
  const path = `customer/api/customer/payment/?customer_id=${encodeURIComponent(customerId)}`;
  return apiFetch<PaymentSummaryResponse>(path);
}

export type PaymentMethod = 'cash' | 'paypay';
export type PayCustomerResponse = {
  status: 'ok';
  payment_method: PaymentMethod;
  time_subtotal: string;
  order_total: string;
  total_amount: string;
};
export async function payCustomer(payload: { customer_id: number; payment_method: PaymentMethod }): Promise<PayCustomerResponse> {
  return apiFetch<PayCustomerResponse>('customer/api/customer/payment/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
