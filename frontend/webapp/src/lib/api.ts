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
    // 一度だけサイレントrefresh
    const r = await fetch(`${base}/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Cookieのrefreshを使う
    });
    if (r.ok) {
      return apiFetch<T>(path, options);
    }
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
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
