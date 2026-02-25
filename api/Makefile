.PHONY: dev unittest docker-db e2e-dev e2e docker-up-e2e docker-down-e2e clean-db unittest-cov

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

docker-up-e2e:
	docker compose -f docker-compose.test.yaml up -d

docker-down-e2e:
	docker compose -f docker-compose.test.yaml down --rmi local -v

unittest-cov:
	pytest -c pytest.unit.ini --cov=./ --cov-report=html