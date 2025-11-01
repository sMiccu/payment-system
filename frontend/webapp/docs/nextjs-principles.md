# Next.js フロントエンド設計ガイド（本システム）

本ドキュメントは「Next.jsの考え方（Chapter 1–27）」の要点を本システムに適用した設計方針・ルール・ベストプラクティスである。Pull Request のレビュー基準かつ自動検証（ESLint/TS/CI）の根拠とする。

## 0. スコープ/目的
- 対象: `frontend/webapp`（App Router）
- 目的: 一貫性・性能・保守性・安全性の最大化、属人性の低減
- 守るもの: 本ガイド、ESLint/TS/CI ルール、PR チェックリスト

---

## 1. Server-first（RSC）原則
- 原則: 既定は Server Component。Client は必要な UI/イベント/ブラウザAPI に限定。
- 責務分離: データ取得とビジネスロジックは Server、表示や操作は Client。

### Do
```tsx
// Server Component でデータ取得し、Client に渡す
export default async function Page() {
  const data = await fetch("https://api.example.com/items", { cache: "force-cache" });
  const items: Item[] = await data.json();
  return <ItemsClient items={items} />; // ItemsClient は最小境界で use client
}
```

### Don't
```tsx
// Client Component で重いフェッチ（非推奨）
"use client";
import { useEffect, useState } from "react";
export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetch("/api/items").then(r => r.json()).then(setItems); }, []);
  return <List items={items} />;
}
```

- 理由: 初期描画を高速化し、バンドルを小さく保ち、SEO/セキュリティも担保。

---

## 2. ルーティング/構造
- App Router を採用し `src/app/**` に集約。グルーピングは `(group)` を使用。
- 命名: ページ `page.tsx`、レイアウト `layout.tsx`、`loading.tsx`、`error.tsx`、`not-found.tsx`。
- 動的: `[param]` は必要最小限。静的化できる場合は `generateStaticParams` を検討。

### Do
```tsx
// src/app/products/[id]/page.tsx
export async function generateStaticParams() { /* ISR も検討 */ }
export default async function Page({ params }: { params: { id: string } }) { /* ... */ }
```

### Don't
```tsx
// ルート直下に無秩序にページ配置（非推奨）
// src/app/page-products.tsx など命名逸脱
```

- 理由: 可読性とナビゲーションの予測可能性を高める。

---

## 3. データ取得
- 既定: Server で `fetch`。キャッシュ戦略を必ず明示（静的/動的/ISR）。
- 動的化トリガ: `cookies()/headers()` を読むと動的化。必要性を精査。
- Server Actions は小規模なフォーム送信や副作用に適用。

### Do
```tsx
// 明示的なキャッシュ方針
export const revalidate = 60; // ISR
export default async function Page() {
  const res = await fetch("https://api.example.com/data", { next: { revalidate: 60 } });
  const data = await res.json();
  return <UI data={data} />;
}
```

### Don't
```tsx
// キャッシュ方針の未指定（非推奨）
const res = await fetch(url); // デフォルト挙動の曖昧化
```

- 理由: キャッシュの一貫性を保ち、予期しない動的化やオーバーフェッチを回避。

---

## 4. 並行フェッチ/メモ化/バッチング
- 複数フェッチは `Promise.all` で並行化。
- 同一リクエストはメモ化で重複を抑止（層に応じて適用）。
- N+1 問題にはサーバ側のバッチ API/DataLoader で対処。

### Do
```tsx
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

### Don't
```tsx
const a = await fetchA();
const b = await fetchB(); // 直列で遅い
```

- 理由: 待ち時間の短縮とバックエンド負荷の平準化。

---

## 5. キャッシュ/再検証
- `revalidate`/`revalidateTag`/`revalidatePath` を用途で使い分け。
- CDN と `Cache-Control` の方針を一致させる。

### Do
```ts
// タグ無効化の例（ミューテーション後）
import { revalidateTag } from "next/cache";
await mutate();
revalidateTag("items");
```

### Don't
```ts
// 無効化忘れで stale 表示を放置
```

- 理由: 更新整合性を保ち UX を崩さない。

---

## 6. レンダリング戦略/Streaming
- 静的優先（SSG/ISR）→ 動的（SSR）は必要時のみ。
- `loading.tsx` と `Suspense` で体感性能を向上。

### Do
```tsx
// サブツリーを遅延
<Suspense fallback={<Skeleton/>}>
  <SlowPart/>
</Suspense>
```

### Don't
```tsx
// 単一巨大ツリーで一括ブロッキング
```

- 理由: 初期可視コンテンツの Time-To-Interactive を改善。

---

## 7. エラー/例外/404
- ルートごとに `error.tsx`/`not-found.tsx` を配置。
- 例外は握り潰さず、サーバでログ送出し UX は簡潔に。

### Do
```tsx
// src/app/(dashboard)/error.tsx
"use client";
export default function Error({ error }: { error: Error }) { return <p>問題が発生しました。</p>; }
```

### Don't
```tsx
// try/catch で全吸収し原因不明化
```

- 理由: デバッグ容易性と安全なエラーメッセージの両立。

---

## 8. メタデータ/SEO
- `generateMetadata` を活用して静的化。OG/Twitter/robots を整備。

### Do
```tsx
export async function generateMetadata() { return { title: "Top" }; }
```

### Don't
```tsx
// ランタイム依存で毎回遅い/不安定
```

- 理由: 安定した SEO とパフォーマンス。

---

## 9. スタイリング/画像
- Tailwind v4 を既定。`next/image` を使用し最適化。

### Do
```tsx
import Image from "next/image";
<Image src="/logo.png" alt="logo" width={120} height={40} loading="lazy" />
```

### Don't
```tsx
// <img> 直書きで最適化/レイアウトシフトを無視
```

- 理由: CLS/LCP 改善とレスポンシブ対応。

---

## 10. フォーム/バリデーション
- `react-hook-form` + `zod` を基本。Server Actions 側でも再検証。

### Do
```tsx
// サーバ側でも zod で再検証
```

### Don't
```tsx
// クライアントのみ検証で改ざんリスク
```

- 理由: 入力改ざんと取りこぼしの両方を抑止。

---

## 11. 認証/認可
- 評価は Server 側。トークンは HttpOnly Cookie。

### Do
```ts
// サーバでユーザ/権限を判定し UI へ結果のみ渡す
```

### Don't
```ts
// Client に機密トークン露出
```

- 理由: 機密保持と一貫したアクセス制御。

---

## 12. 依存/インポート規約
- ルートエイリアス `@/*` を使用。
- Client から Server-only モジュール（`fs` など）禁止。
- import 整理/未使用排除は自動検証。

---

## 13. 型/品質/テスト
- TS は strict + 追加の厳格オプション。
- ロジック中心の単体テスト/E2E は重要導線に限定。

---

## 14. a11y/パフォーマンス
- `next/core-web-vitals` のルールを尊重。
- 画像最適化・コード分割・`next/script` を戦略的に使用。

---

## 15. セキュリティ
- XSS/CSRF を考慮。サーバログへ PII を記録しない。
- 依存監査を定常化。

---

## 16. ディレクトリ規約
- 画面: `src/app/**`
- 共通 UI: `src/components/ui/**`
- アプリ用コンポーネント: `src/components/**`
- ドメイン/ユーティリティ: `src/lib/**`

---

## 17. 運用手順
- `npm run validate` を PR の必須ゲートに設定。
- 本ガイドは随時アップデートし差分をレビュー基準へ反映。

---

付録A: 代表的アンチパターン一覧
- Client で過剰なデータ取得
- キャッシュ方針の未指定
- import の無秩序/未使用の放置
- 画像の最適化不足
- 例外の握り潰し

付録B: チェックリスト（PR）
- Server-first 準拠か
- キャッシュ/再検証方針の明示
- エラー/ローディングの用意
- import 整理/未使用なし
- 型エラーなし/`npm run validate` 通過
