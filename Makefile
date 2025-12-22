.PHONY: all
all: pipinstall loaddata runserver

pipinstall:
	pip install -r payment_system/requirements.txt

loaddata:
	python payment_system/manage.py migrate
	python payment_system/manage.py flush --no-input
	python payment_system/manage.py loaddata payment_system/seed.json

runserver:
	python payment_system/manage.py runserver 0.0.0.0:8000
