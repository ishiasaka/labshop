.PHONY: dev unittest docker-db e2e-dev e2e

dev:
	fastapi dev main.py

unittest:
	pytest -c pytest.unit.ini -v 

docker-db:
	docker compose up -d db-replica db-replica-init

e2e-dev:
	E2E_TEST_MODE=true fastapi dev main.py

clean-db:
	python -m e2e.clean_db

e2e:
	pytest -c pytest.e2e.ini -v --tb=short 