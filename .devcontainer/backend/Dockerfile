FROM python:3.13.6

# 作業ディレクトリを設定（devcontainer と統一）
RUN mkdir -p /workspaces/payment_system
WORKDIR /workspaces/payment_system

# 必要なツールをインストール
RUN apt-get update && apt-get install -y \
    git \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 参考: runtime は bind mount で上書きされるため COPY は省略可だが、必要なら残す
COPY . /workspaces/payment_system/

# RUN pip install -r requirements.txt

# RUN pip install -r requirements.txt \
#     && cd payment_system \
#     && python manage.py migrate

# コンテナが終了しないようにする
CMD ["sleep", "infinity"]
