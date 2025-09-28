## Dev Container 開発環境ガイド

このフォルダは VS Code Dev Containers（Remote - Containers）で本リポジトリを開発するための設定をまとめています。接続先は `backend` コンテナ 1つに固定し、`frontend` と `db` はサイドカーとして同時起動する構成です。

### 概要
- **接続先コンテナ**: `backend`
- **同時起動サービス**: `backend`, `frontend`, `db`（MySQL）
- **ワークスペースパス**: `/workspaces/payment_system`（全サービスで統一）
- **ポート**: `8000`(Django), `3000`(Next.js), `9229`(Node Inspector)

### ファイル構成
- `devcontainer.json`: Dev Containers のメイン設定（接続先・マウント・起動サービスなど）
- `docker-compose.yml`: 各サービス（backend/frontend/db）の定義
- `backend/Dockerfile`: Python ベースの開発用イメージ（最低限のツール）
- `frontend/Dockerfile`: Node ベースの開発用イメージ（最低限のツール）

### 重要な設定ポイント
- `workspaceFolder`: `/workspaces/payment_system`
- `workspaceMount`: `source=${localWorkspaceFolder},target=/workspaces/payment_system,type=bind,consistency=cached`
- `runServices`: `backend`, `frontend`, `db`
- `frontend` は Node Inspector を `9229` で待受け（VS Code からアタッチ）

### 初回セットアップ（既に実施済み）
Next.js アプリは `frontend/webapp` に作成済みです。未作成の場合は以下のコマンドで一度だけ生成し、Git にコミットします。

```bash
docker compose -f .devcontainer/docker-compose.yml run --rm frontend \
  sh -lc 'npx create-next-app@latest frontend/webapp --ts --eslint --use-npm --src-dir --app --import-alias "@/*" --yes'
git add frontend/webapp && git commit -m "chore(frontend): bootstrap Next.js (TS+ESLint)"
```

### 使い方（通常の流れ）
1. VS Code で「Reopen in Container」を実行
2. 起動後、自動で以下が有効
   - Django: `python manage.py runserver 0.0.0.0:8000`
   - Next.js: `npm run dev`（`9229` で Inspector 待受け）
3. ブラウザ確認
   - Django: `http://localhost:8000`
   - Next.js: `http://localhost:3000`

### デバッグ
- Frontend（Node アタッチ）
  - `.vscode/launch.json` の構成「Attach: Frontend (Node 9229)」を実行
  - ブレークポイントは `frontend/webapp` 配下に設定
  - マッピング: `localRoot=${workspaceFolder}/frontend/webapp`, `remoteRoot=/workspaces/payment_system/frontend/webapp`

- Backend（任意: Python attach）
  - 例: `python -m debugpy --listen 0.0.0.0:5678 manage.py runserver 0.0.0.0:8000`
  - VS Code 側で Python Attach を 5678 に設定

### よくあるハマりどころと対処
- ワークスペースが見えない/存在しない
  - `workspaceFolder` と マウント先（Compose or workspaceMount）が `/workspaces/payment_system` に揃っているか確認

- frontend が起動しない（Alpine で `bash` が無い）
  - Compose の `command` は `sh -lc` を使用（Alpine には `bash` が無い前提）

- ポート競合
  - `3000`/`8000`/`9229` を他プロセスが使用していないか確認

### コマンド例（個別操作）
```bash
# backend 単体の再起動
docker compose -f .devcontainer/docker-compose.yml up -d --build backend

# frontend 単体の再起動
docker compose -f .devcontainer/docker-compose.yml up -d --build frontend

# ログ確認
docker compose -f .devcontainer/docker-compose.yml logs -f backend
docker compose -f .devcontainer/docker-compose.yml logs -f frontend
```

### 方針
- VS Code は `backend` コンテナにのみ接続
- `frontend`/`db` は sidecar として同時起動
- リポジトリ全体を 1 ワークスペースとして扱い、`frontend` と `backend` のコードを同じウィンドウで編集


