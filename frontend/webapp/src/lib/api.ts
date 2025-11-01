export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  // 既定は相対パス（Nextのrewritesで同一オリジンにプロキシ）。必要なら NEXT_PUBLIC_API_BASE で上書き。
  const base = process.env.NEXT_PUBLIC_API_BASE ?? '';
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
    const r = await fetch(`${base}/api/refresh/`, {
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
