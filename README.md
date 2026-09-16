# payment-system

店舗スタッフ向けに、来店中の顧客、会員、メニュー、注文、滞在料金、会計を管理するWebアプリケーションです。

## 技術構成

- Frontend: Next.js 15、React 19、TypeScript、Tailwind CSS 4
- Backend: Django 5.2、Django REST Framework
- Database: PostgreSQL 16
- Authentication: SimpleJWT（HttpOnly Cookie）
- Development: Docker Compose、Dev Container

ユーザーは店舗に所属し、顧客・メニュー・注文・料金設定などはログインユーザーの店舗単位で表示されます。

## ローカル初回セットアップ

### 前提条件

- Docker Desktopが起動していること
- `make` コマンドを利用できること
- 次のポートが空いていること
  - `3001`: Frontend
  - `8000`: Backend
  - `5432`: PostgreSQL
  - `9229`: Node Inspector

### 1. 起動・DB初期化・サンプルデータ投入

リポジトリのルートで実行します。

```bash
make dev-setup
```

初回はDocker imageのビルド、Python/npmパッケージの導入があるため数分かかる場合があります。

> [!WARNING]
> `make dev-setup` はDB内の既存データを削除し、`payment_system/seed.json` の内容へ置き換えます。
> 2回目以降に現在のデータを維持して起動する場合は `make dev-up` を使用してください。

### 2. ブラウザでログイン

Frontend:

<http://localhost:3001/login>

店舗別のサンプルユーザー:

| 店舗 | ユーザー名 | パスワード |
| --- | --- | --- |
| A001 | `test_user` | `test1234` |
| B002 | `testb002` | `test1234` |
| C003 | `testc003` | `test1234` |

ログイン後、選択したユーザーの店舗に所属する顧客、カテゴリー、メニュー、注文、料金設定を確認できます。

管理者画面:

- URL: <http://localhost:8000/admin/login/>
- ユーザー名: `admin`
- パスワード: `admin`

`admin` は店舗未所属のため、Frontendの店舗別データ確認には上記の店舗別ユーザーを利用してください。

## 日常的に使うコマンド

```bash
# 既存データを維持して全サービスを起動
make dev-up

# サービスの状態を確認
make dev-ps

# Backend、Frontend、DBのログを表示
make dev-logs

# migrationのみ実行
make dev-migrate

# DBを初期化してサンプルデータを再投入
make dev-seed

# 全サービスを停止（DB volumeは維持）
make dev-down
```

`make dev-seed` も既存DBデータを削除します。

## サービス構成

| サービス | ホストURL・ポート | 役割 |
| --- | --- | --- |
| Frontend | <http://localhost:3001> | Next.js UI |
| Backend | <http://localhost:8000> | Django REST API・管理画面 |
| Database | `localhost:5432` | PostgreSQL |

Compose設定は `.devcontainer/docker-compose.yml` を使用します。Frontendはコンテナ内の3000番ポートを、ホストの3001番ポートへ公開しています。

## Dev Containerを使う場合

VS Code / Cursorで「Reopen in Container」を実行すると、`backend` コンテナへ接続し、`frontend` と `db` もsidecarとして起動します。

サービス起動後、初回だけホスト側のターミナルから次を実行してください。

```bash
make dev-wait
make dev-seed
```

Dev Containerの詳細は [`.devcontainer/README.md`](.devcontainer/README.md) を参照してください。

## 主なサンプルデータ

- 店舗: A001、B002、C003
- カテゴリー: ドリンク、フード、デザート
- メニュー: ホットコーヒー、サンドイッチ、ケーキ、エスプレッソ、パスタ、紅茶、カレー
- 顧客・会員・注文・時間料金・日次売上

## トラブルシュート

### 画面を開けない

サービス状態とログを確認します。

```bash
make dev-ps
make dev-logs
```

### ポートが使用中と表示される

`3001`、`8000`、`5432`、`9229` を使用している別プロセスを停止してから、再度 `make dev-up` を実行してください。

### ログイン後にデータが表示されない

`admin` ではなく、`test_user`、`testb002`、`testc003` のいずれかでログインしてください。データはユーザーの所属店舗で絞り込まれます。

### DBをサンプル状態へ戻したい

```bash
make dev-seed
```

この操作は現在のDBデータを削除します。
