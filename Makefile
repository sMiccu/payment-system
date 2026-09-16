.PHONY: all pipinstall loaddata runserver \
	dev-up dev-wait dev-migrate dev-seed dev-setup dev-down dev-logs dev-ps

COMPOSE := docker compose -p payment-system_devcontainer -f .devcontainer/docker-compose.yml

all: pipinstall loaddata runserver

pipinstall:
	pip install -r payment_system/requirements.txt

loaddata:
	python payment_system/manage.py migrate
	python payment_system/manage.py flush --no-input
	python payment_system/manage.py loaddata payment_system/seed.json

runserver:
	python payment_system/manage.py runserver 0.0.0.0:8000

dev-up:
	$(COMPOSE) up -d --build

dev-wait:
	@echo "Backendの準備完了を待っています..."
	@attempt=0; \
	until $(COMPOSE) exec -T backend bash -lc \
		'cd payment_system && python manage.py check' >/dev/null 2>&1; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -ge 120 ]; then \
			echo "Backendの準備が完了しませんでした。make dev-logs でログを確認してください。"; \
			exit 1; \
		fi; \
		sleep 2; \
	done
	@echo "Frontendのログイン画面を待っています..."
	@attempt=0; \
	until curl --fail --silent --output /dev/null http://localhost:3001/login; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -ge 120 ]; then \
			echo "Frontendの準備が完了しませんでした。make dev-logs でログを確認してください。"; \
			exit 1; \
		fi; \
		sleep 2; \
	done

dev-migrate:
	$(COMPOSE) exec -T backend bash -lc \
		'cd payment_system && python manage.py migrate'

dev-seed:
	@echo "警告: DB内の既存データを削除してseedデータへ置き換えます。"
	$(COMPOSE) exec -T backend bash -lc \
		'cd payment_system && python manage.py migrate && python manage.py flush --no-input && python manage.py loaddata seed.json'

dev-setup: dev-up dev-wait dev-seed
	@echo "セットアップ完了: http://localhost:3001/login"

dev-down:
	$(COMPOSE) down

dev-logs:
	$(COMPOSE) logs -f backend frontend db

dev-ps:
	$(COMPOSE) ps
