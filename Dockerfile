FROM python:3.13.6
ENV PYTHONUNBUFFERED 1
RUN mkdir /payment-system
WORKDIR /payment-system
COPY . /payment-system/

RUN pip install -r requirements.txt
