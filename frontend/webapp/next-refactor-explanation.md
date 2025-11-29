## このドキュメントの目的

このドキュメントは、現在の Next.js フロントエンドを **Next.js/App Router のベストプラクティスに近づけるためのリファクタ構想**について、

- **出てきた用語・技術の解説**
- **リファクタ前後で何がどう変わるのか（構造・責務・コード量など）**

を、開発者向けに詳しくまとめたものです。

---

## 用語・技術解説

### Next.js App Router / App Directory

- **App Router**
  - Next.js 13 以降で導入された新しいルーティング方式。
  - `src/app` ディレクトリ配下のフォルダ・ファイルでルーティングを定義する。
  - 例: `src/app/top/page.tsx` → `/top` パスのページ。
- **従来の Pages Router との違い**
  - `pages` ディレクトリではなく、`app` ディレクトリを使う。
  - デフォルトで **Server Components** が使われる。
  - レイアウト（`layout.tsx`）や `loading.tsx`、`error.tsx` など、ページの構造や状態を細かく定義できる。

### Server Component / Client Component

- **Server Component**
  - 特別な指定がなければ、`app` 配下のコンポーネントは Server Component。
  - サーバー上でレンダリングされ、ブラウザには HTML と最小限の JS だけが送られる。
  - `useState` / `useEffect` などの React Hooks は使えない。
  - 特徴:
    - 直接 DB や外部 API を呼び出せる（サーバーサイド）。
    - バンドルサイズを減らせる。
- **Client Component**
  - ファイルの先頭に `"use client";` と書かれたコンポーネント。
  - ブラウザ上で実行され、`useState` / `useEffect` / `useRouter` などのフックが使える。
  - フォーム、モーダル、アニメーションなど **インタラクティブな UI** に使う。
- **今回の構想での使い分け**
  - `/app/top/page.tsx` などのページ: 可能な部分は Server Component に。
  - 実際の UI ロジック（顧客一覧・注文フォームなど）は Client Component に切り出す。

### Layout（`layout.tsx`）と ルートグループ

- **Layout**
  - 各ルート（フォルダ）に `layout.tsx` を置くことで、その配下のページに共通するレイアウトを定義できる。
  - 例: サイドバー、ヘッダー、フッターなど。
- **ルートグループ**
  - フォルダ名を `(...)` で囲むことで、URL には現れないグループを作れる。
  - 例: `app/(auth)/top/page.tsx` → URL は `/top`
  - 用途:
    - 「認証必須の画面」と「ログイン画面」でレイアウトを分けたい場合などに便利。

### Custom Hooks（カスタムフック）

- `useSomething` という名前の関数で、React のロジックを再利用する仕組み。
- 例:
  - `useCustomers()` : 顧客一覧の取得・ローディング・エラー状態をまとめる。
  - `useCustomerBreak(customerId)` : 休止/再開トグルのロジックだけを切り出す。
- メリット:
  - ページコンポーネントからビジネスロジックを分離できる。
  - テストや再利用がしやすい。

### SWR / React Query（データフェッチ用ライブラリ）

- どちらも「**データフェッチ + キャッシュ + 再検証**」を扱うライブラリ。
- **SWR**
  - Vercel（Next.js の会社）が作っている。
  - `useSWR(key, fetcher)` というシンプルな API。
  - フロントエンドのデータ取得を「キャッシュ + 自動再フェッチ」で最適化。
- **React Query（TanStack Query）**
  - API がより豊富で、複雑なキャッシュ戦略やミューテーション管理が得意。
  - `useQuery` / `useMutation` など。
- 今回の構想では:
  - 現状の `apiFetch + useEffect + useState` ベースを、
  - 将来的に SWR/React Query に移行できる構造（Custom Hooksベース）にすることを想定。

### Suspense / Error Boundary

- **Suspense**
  - 非同期処理（データ取得など）の完了を待つ間、フォールバック UI（ローディング表示）を出す仕組み。
  - Next.js App Router では、`<Suspense>` コンポーネントか、`loading.tsx` ファイルで利用。
  - 例: 注文履歴やメニュー一覧など、読み込み中のスケルトン UI に使える。
- **Error Boundary**
  - 子コンポーネントで発生したレンダリングエラーをキャッチして、エラーメッセージやリトライUIを表示する。
  - App Router では `error.tsx` を置くことでルート単位の Error Boundary が作れる。

### ドメイン（機能）単位のフォルダ構成（feature-based / domain-driven）

- **従来の構成**: `pages` / `components` / `lib` など、技術別に分ける。
- **今回の構想**: `customer` / `order` / `payment` といった **ビジネス機能単位** でまとめる。
  - 例:
    - `features/customer/api/useCustomers.ts`
    - `features/customer/types.ts`
    - `components/features/customer/CustomerList.tsx`
- メリット:
  - 機能ごとに見通しが良くなり、どこに何があるか分かりやすい。
  - 機能単位での責務分離が進み、変更の影響範囲を抑えやすい。

### 型定義（types / models）と変換関数

- **APIレスポンス型** と **UIで使う型** を分ける考え方。
  - 例:
    - `CustomerApiResponse`: バックエンドの JSON レスポンスそのままの型。
    - `Customer`: フロントエンドで扱いやすく整形した型。
- 違いの例:
  - `start_datetime` (APIのsnake_case, string) → `startDatetime` (camelCase) など。
- **変換関数**
  - `transformCustomer(api: CustomerApiResponse): Customer` のような関数で、
    APIレスポンスを UI 用の型にマッピングする。

### ユーティリティ（共通関数）の集約

- 例:
  - `formatCurrency`（金額のフォーマット）
  - `formatDateTime`（日時の表示）
  - `formatMs` / `formatMinutes`（時間の表示）
- 現状はページ内にバラバラに存在している関数を `lib/utils/format.ts` などに集約。

### Layout の再利用（サイドバー付きレイアウト）

- 現在各ページで毎回 `<AppSidebar />` と `<main className=...>` を書いている。
- ベストプラクティスとしては:
  - `app/(auth)/layout.tsx` に
    - サイドバー
    - 共通の `<main>` ラッパ
  をまとめて、配下のページは **中身だけ** に集中させる。

---

## 現状の構造と課題

### フォルダ構成（リファクタ前）

ざっくり言うと、以下のような構成になっています:

- `src/app`
  - `top/page.tsx` など **各ページの UI とロジックがほぼ全部ここに詰まっている**
- `src/components`
  - `layout/` にヘッダーやサイドバー
  - `ui/` にボタン・カードなどの Atom コンポーネント
- `src/lib`
  - `api.ts` に API 呼び出し関数と型定義が混在
  - `utils.ts` に汎用関数（一部）

### 主な課題

- **ページコンポーネントが巨大**
  - 例: `top/page.tsx` は 800 行以上。
  - 状態管理・API呼び出し・表示ロジック・レイアウトが一体化している。
- **ロジックの重複・分散**
  - 電話番号の E.164 変換ロジック (`toE164`) などが複数箇所に存在。
  - 会員検索ロジックが `top` と `customer-register` に似た形で重複。
- **ビジネスロジックと UI の密結合**
  - `useState` / `useEffect` / API 呼び出しが JSX と混ざっており、テストしづらい。
- **共通レイアウトの重複**
  - 各ページで毎回 `<AppSidebar />` + `main className="flex-1 p-8 overflow-y-auto">` を書いている。

---

## リファクタ後の構造（構想）

### 提案フォルダ構成（概要）

```text
src/
├── app/
│   ├── (auth)/                  # 認証が必要な画面のグループ
│   │   ├── layout.tsx           # サイドバー付き共通レイアウト
│   │   ├── top/
│   │   ├── order/
│   │   ├── payment/
│   │   └── ...
│   ├── login/                   # ログイン画面（認証不要）
│   └── layout.tsx               # 全体レイアウト
│
├── components/
│   ├── features/
│   │   ├── customer/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerDetails.tsx
│   │   │   ├── MembershipSearch.tsx
│   │   │   └── index.ts
│   │   ├── order/
│   │   │   ├── MenuList.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   ├── OrderHistory.tsx
│   │   │   └── index.ts
│   │   └── payment/
│   │       ├── PaymentSummary.tsx
│   │       ├── PaymentMethodSelector.tsx
│   │       └── index.ts
│   ├── layout/
│   └── ui/
│
├── features/
│   ├── customer/
│   │   ├── api/
│   │   │   ├── useCustomers.ts
│   │   │   ├── useCustomerQuote.ts
│   │   │   └── useMembership.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── order/
│   │   ├── api/
│   │   │   ├── useMenus.ts
│   │   │   ├── useOrderHistory.ts
│   │   │   └── useCreateOrder.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── payment/
│       ├── api/
│       │   └── usePayment.ts
│       ├── types.ts
│       └── utils.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts            # apiFetch など共通HTTPクライアント
│   │   └── index.ts
│   ├── hooks/                   # 完全に汎用的なhooks
│   │   ├── useDebounce.ts
│   │   └── usePolling.ts
│   └── utils/
│       ├── format.ts            # 金額・日付・時間フォーマット
│       ├── date.ts
│       └── index.ts
│
└── types/
    ├── api.ts                   # 共通APIレスポンス型
    └── models.ts                # 画面で使う共通モデル
```

---

## リファクタ前後の「何がどう変わるか」

### 1. フォルダ構造・責務の分割

#### Before

- ページごとに「API呼び出し + 状態管理 + UI + レイアウト」が 1 ファイルに集約。
- 機能別のまとまりが薄く、「顧客」「注文」「会計」の境界が曖昧。

#### After

- **機能（ドメイン）単位** に
  - UIコンポーネント (`components/features/...`)
  - ビジネスロジック・API (`features/.../api`)
  - 型・ユーティリティ (`features/.../types.ts`, `utils.ts`)
  をまとめる。
- ページ (`app/.../page.tsx`) は
  - ほぼ「画面全体をどう並べるか」だけに集中。

**効果**

- 「どのコードがどの機能に属しているか」が明確になる。
- 新しい機能追加や変更の際に、触るべきファイルが絞りやすい。

---

### 2. ページコンポーネントのサイズと役割

#### Before（例: `top/page.tsx`）

- 800 行超えの 1 ファイルに:
  - 顧客一覧の取得
  - 休止/再開の処理
  - 注文・料金・履歴の取得
  - 会員検索・紐付け
  - 表示用のフォーマット関数
  - JSX による詳細な UI
  がすべて同居。

#### After（構想）

- `app/top/page.tsx`
  - Server Component。
  - 必要なら初期データ（顧客一覧など）だけサーバーで取得。
  - 実際の UI は `<CustomerList initialData={...} />` のような Client Component に委譲。
- `components/features/customer/CustomerList.tsx`
  - 顧客一覧のレンダリング。
  - 「行」を `CustomerCard` などに分割。
- `components/features/customer/CustomerDetails.tsx`
  - 展開時に表示する詳細情報（注文内訳・料金・履歴・統計）を担当。
- `components/features/customer/MembershipSearch.tsx`
  - 会員検索・紐付け UI を分離。
- `features/customer/api/useCustomers.ts`
  - 顧客一覧の取得・ローディング・エラー管理。
- `features/customer/api/useCustomerBreak.ts`
  - 休止/再開 API 呼び出しと状態。
- `features/customer/api/useMembership.ts`
  - 会員検索・紐付け・更新の API 呼び出しロジック。

**効果**

- 各コンポーネントは 100〜200 行前後に収まり、読みやすくなる。
- 機能ごとにテストしやすくなる。
- UI の変更（見た目）はコンポーネント側、ロジックは Hooks 側だけを見ればよくなる。

---

### 3. ビジネスロジックと UI の分離

#### Before

- JSX 内で直接 `apiFetch` を呼び、結果を `useState` で保持し、そのままレンダリング。
- ロジックを単体テストしようとすると「Reactコンポーネントごとテスト」になりがち。

#### After

- API まわりの処理・状態は **Custom Hooks** 側に集約:
  - `useCustomers`
  - `useCustomerQuote`
  - `usePaymentSummary`
  - `useOrderHistory`
  - `useCreateOrder`
  - `usePayment` など
- UI コンポーネントは Hook の戻り値（`data`, `isLoading`, `error` など）を受け取って描画するだけ。

**効果**

- Hooks 単位でビジネスロジックをテストできる。
- UI コンポーネントは「見た目のテスト」に集中できる。

---

### 4. 共通ロジック（フォーマット関数など）の整理

#### Before

- `formatCurrency`, `formatDateTime`, `formatMs`, `toE164` などが
  - `top/page.tsx`
  - `customer-register/page.tsx`
  - `payment/page.tsx`
  などにバラバラに存在。

#### After

- `lib/utils/format.ts`
  - 金額・日時・時間を表示用に整形する関数をまとめる。
- `features/customer/utils.ts`
  - 顧客・会員まわりでだけ使うユーティリティ（例: E.164 変換など）をまとめる。

**効果**

- 同じ仕様変更（例: 金額の表示ルール変更）を 1 箇所だけ直せばよくなる。
- 共通ユーティリティが明示されることで、新規実装時に再利用を意識しやすい。

---

### 5. レイアウトとナビゲーションの整理

#### Before

- ほとんどのページで:
  - `<AppSidebar />`
  - `<main className="flex-1 p-8 overflow-y-auto">...</main>`
  を個別に書いている。

#### After

- `app/(auth)/layout.tsx` に共通レイアウトを集約:
  - サイドバー
  - パディング・スクロール設定
- 認証不要の `login` 画面などは
  - ルートグループの外（`app/login/page.tsx`）に置いて、別レイアウトで表示。

**効果**

- レイアウト変更（例: サイドバー幅の変更、背景色の変更）が 1 ファイルの修正で済む。
- 各ページはコンテンツに集中できる。

---

### 6. データフェッチ戦略（将来的な拡張）

#### Before

- 各ページで `apiFetch + useEffect + useState`。
- キャッシュや再取得の戦略がページごとに手書き。

#### After（構想レベル）

- Hooks 層 (`features/.../api/useXxx.ts`) を用意しておくことで:
  - 今後 `SWR` や `React Query` を導入しても、
  - ページやコンポーネント側の変更は最小限（Hook の中身だけ差し替えれば良い）。

**効果**

- 段階的なリファクタが可能（いきなり全ページを書き換える必要がない）。
- キャッシュやポーリングなどの高度な機能を追加しやすい。

---

### 7. サーバーサイドとクライアントサイドの責務分担

#### Before

- ほぼすべてのページが `"use client"` で始まり、クライアント側でデータを取得。

#### After

- ページレベルでは可能な部分を Server Component に寄せる。
  - 例: 認証済みユーザー情報、静的に近いマスターデータなどは Server側で取得。
- インタラクションが必要な UI は Client Component に限定。

**効果**

- 不必要なクライアント JavaScript を削減でき、パフォーマンス向上が期待できる。
- セキュリティ上、サーバー側で閉じたままにしたいロジックを Server Component 内に閉じ込められる。

---

## まとめ

- このリファクタ構想では、
  - **フォルダ構成の整理（ドメイン単位）**
  - **ページからロジックを切り出す（Custom Hooks + feature層）**
  - **共通ユーティリティの集約**
  - **Layout / Server Component の活用**
  を通じて、Next.js/App Router のベストプラクティスに近づけることを目指しています。
- 結果として:
  - 各ファイルの行数が減り、
  - 機能ごとの責務が明確になり、
  - 将来の機能追加・仕様変更・ライブラリアップデートに強い構造になります。

実際の実装に入る際は、このドキュメントを「リファクタの地図」として使いながら、ページ単位・機能単位で段階的に進めていく想定です。***


