.PHONY: dev e2e

dev:
	fastapi dev main.py

e2e-dev:
	E2E_TEST_MODE=true fastapi dev main.py

e2e:
	pytest -c pytest.e2e.ini -v --tb=short 

unittest:
	pytest -c pytest.unit.ini -v --tb=short