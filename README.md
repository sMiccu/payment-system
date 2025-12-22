# payment-system

ローカル開発および起動方法のメモ。

## ローカル起動（Dev Container）
- VS Code で「Reopen in Container」を実行
- 起動後のアクセス先
  - Backend (Django): `http://localhost:8000`
  - Frontend (Next.js): `http://localhost:3001`  ← 開発時は 3001 を使用

メモ: ホスト側 3000 の挙動が不安定な環境があるため、Dev Container では `ports: "3001:3000"` で公開しています（本番には影響しません）。

## デバッグ（保留/TODO）
- Next.js の Node アタッチは 2 系統（Next 15）
  - Node メイン: 9229
  - Router Server: 9230
- VS Code 側の構成は `.vscode/launch.json` に定義済み（9229/9230、および複合）
- 使い方の詳細は一旦保留。必要時に `.devcontainer/README.md` を参照しつつ整備予定。

## 個別操作コマンド例
```bash
# frontend 再起動（Dev Container 用 compose を明示）
docker compose -p payment-system_devcontainer -f .devcontainer/docker-compose.yml up -d --build frontend
docker compose -p payment-system_devcontainer -f .devcontainer/docker-compose.yml logs -f frontend
```
