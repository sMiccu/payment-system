# 公式のNode.jsイメージをベースにする
FROM node:20-alpine

# 作業ディレクトリを設定（backend と統一）
WORKDIR /workspaces/payment_system

# 必要なツールをインストール
RUN apk add --no-cache git

# コンテナが終了しないようにする
CMD ["sleep", "infinity"]