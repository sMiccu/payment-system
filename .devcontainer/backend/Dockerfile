FROM python:3.13.6

# 作業ディレクトリを設定
RUN mkdir /payment-system
WORKDIR /payment-system

# 必要なツールをインストール
RUN apt-get update && apt-get install -y \
    git \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY . /payment-system/

# RUN pip install -r requirements.txt

# RUN pip install -r requirements.txt \
#     && cd payment_system \
#     && python manage.py migrate

# コンテナが終了しないようにする
CMD ["sleep", "infinity"]
