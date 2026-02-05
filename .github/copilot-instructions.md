# Copilot Instructions (Project: labshop)

## Role

- You are a senior engineering assistant helping the `labshop` team.
- Primary stacks: FastAPI (backend, Python), Next.js (frontend, React/TypeScript), Rust (Reader Agent / edge components).

## Project Context

- **Goal:** Build a reliable in-school shop system with NFC/FeliCa card readers (Reader Agent in Rust), a FastAPI backend that stores transactions in MongoDB, and a Next.js tablet frontend that communicates via the API and WebSockets.
- **Key constraints:** offline/edge robustness (serial/USB readers, Raspberry Pi), correct transaction accounting (payments vs purchases), and collaborative multi-platform development in a monorepo.

## Coding Principles (high level)

1. **Single Responsibility:** Prefer small focused modules and functions.
2. **Explicit Types:** Use typing everywhere in Python (type hints / Pydantic models) and TypeScript (no `any`).
3. **Fail Fast & Observable:** Validate inputs early; log structured context for unexpected states.
4. **Idempotency & Consistency:** Design API endpoints and reader interactions to be idempotent where possible (e.g., dedupe transaction IDs).
5. **Keep business rules out of the UI:** Put authoritative logic on the backend.
6. **Security by default:** Always validate and sanitize at the API boundary.

## FastAPI (backend) guidelines

- Use Pydantic models for request/response validation and for DB documents mapping.
- Prefer async endpoints for I/O-bound work; run with `uvicorn` + `gunicorn` or `uvicorn` with multiple workers in production.
- Use dependency injection for DB and auth resources.
- Keep business logic in services (not directly in route handlers).
- Database: MongoDB via Beanie ODM. Store canonical timestamps as ISODate (e.g., UTC `created_at` as datetime).
- Use transactions when updating multiple collections (e.g., user balance + payments collection + purchases collection).
- Return clear error responses with meaningful HTTP status codes and problem details.

## Next.js (frontend/tablet app) guidelines

- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Material UI (MUI).
- **Internationalization (i18n)**:
  - All text must be internationalized.
  - Dictionary: `app/locales/index.ts`.
  - Pattern: Define keys in `en` first. Ensure `ja` (and other languages) match the `en` keys structure exactly.
  - Usage: Import `translations` and use the `useLanguage` context hook to get the current language key.
- **Testing**:
  - Framework: Jest + React Testing Library.
  - Pattern: Co-locate tests with components in `__tests__` directories or identical filename `.test.tsx` suffixes.
  - Run: `nvm use && yarn test` or `nvm use && yarn test:watch` during development.
  - Requirement: Critical user flows (like the "ThemeToggle" or "LanguageSwitcher") must have unit tests.
- **Styling & Components**:
  - Use Material UI (`@mui/material`) for core components.
  - Avoid raw CSS/SCSS modules unless standard MUI customization is insufficient.
  - Theme: Respect the system preference or user toggle (see `app/theme.ts`).
- **State Management**:
  - Use React Context for global UI state (like `LanguageContext`).
  - Keep server state (data) management simple (fetch in Server Components where possible, or use standard patterns).
- Real-time: WebSocket between API and frontend for live updates; fallback to polling if necessary.
- UX: Avoid placing business logic on frontend — it should reflect server-side state.

## Rust (Reader Agent) guidelines

- Use `tokio` for async runtime.
- Use `serialport` (or `tokio-serial`) for serial/USB communication with readers.
- Keep reader responsibilities minimal: read card UID / reader port ID / timestamp and send compact JSON/HTTP to the API or to a local edge aggregator.
- Use retries with exponential backoff for transient network failures; persist events locally (file or lightweight queue) until successfully acknowledged by server.
- Use `serde` for JSON serialization and `reqwest` for HTTP client (async).
- Format and lint: `cargo fmt` + `cargo clippy`.

## Database & Data Model (MongoDB) guidance

- Use `id` as the canonical primary field in all collections (store as ObjectId or string, be consistent).
- Keep denormalized fields (e.g., `account_balance` on `users`) for fast reads, but update them transactionally with the canonical records (payments/purchases).
- Preserve immutable snapshots: store `price` on `purchase` records to snapshot the price at purchase time.
- Timestamps: store `created_at` and `updated_at` as datetimes (UTC).

## Testing, CI and Quality

- Backend: `pytest` with test DB fixtures (use a test MongoDB instance or in-memory alternative). Run unit tests and integration tests for service functions and endpoints.
- Frontend: unit tests (Jest/React Testing Library) and E2E (Playwright) covering main flows (scan → transaction).
- Reader Agent: unit tests where possible; integration tests for serial I/O are harder—mock serial port inputs in tests.
- Lint & format: Python -> `black`, `isort`, `ruff`. JavaScript/TS -> `prettier`, `eslint`. Rust -> `cargo fmt`, `cargo clippy`.
- CI pipeline should run linters, format checks, unit tests and a minimal integration test matrix.

## DOs

- DO write clear Pydantic models and share them with the frontend TypeScript types (use OpenAPI or codegen if useful).
- DO keep backend logic authoritative; the frontend must not implement business-critical checks alone.
- DO use idempotency keys for transactions coming from edge devices.
- DO add structured logs (JSON) with correlation IDs for debugging cross-service flows.
- DO keep secrets and credentials in environment variables and the CI secret store (never commit `.env` files).
- DO document local run steps and API contracts (OpenAPI endpoints).
- DO write small, focused PRs with a clear description and testing steps.

## DON'Ts

- DON'T store plaintext secrets or API keys in the repository.
- DON'T rely on the reader agent to be always online — design for offline buffering.
- DON'T use floats for money in backend logic; use integers (cents) or fixed-decimal types.
- DON'T put complex business rules only in the frontend.
- DON'T ignore linter and formatting errors in PRs.

## Commits, Branching & PR workflow

- Branch naming: `feat/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`, `doc/<short-desc>`.
- Commit messages: short header (50 chars) + optional body; reference issue/PR when relevant.
- Each PR should include: description, related issue, testing steps, and screenshots where applicable.
- Require at least one approving review before merging; use `squash` or `merge` per project preference.

## PR Review Checklist (use as template)

- Code builds and tests pass locally.
- Linter/format checks passed.
- New public API changes documented in OpenAPI/README.
- Security: no secrets, input validation present, rate-limiting or abuse checks where needed.
- Data: DB schema migrations or compatibility notes are provided if needed.

## Local dev & Run commands (examples)

```bash
# Backend (dev)
cd api && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Frontend (dev)
Refer to `./tablets/README.md`

# Reader Agent (dev)
cd scanner && cargo run --bin reader-agent

# Run linting/formatting: use project Makefile or language-specific formatters
```

## Security & Secrets

- Use env vars and a secrets manager for production credentials.
- Rotate keys periodically; document where each key is used.
- Use HTTPS/TLS for all network traffic between agents and API.
- Validate and limit payload size from edge devices.

## Observability & Monitoring

- Export metrics (Prometheus) from backend and reader agents if feasible.
- Push errors to an error-tracking system (Sentry) and ensure 5xx errors are monitored.
- Add healthchecks for critical services (API, DB, Reader Agent connectivity).

## Inter-service contracts

- For simple integrations, use JSON over HTTPS with clear field names (e.g., `student_uid`, `reader_id`, `shelf_id`, `timestamp`, `idempotency_key`).
- Consider OpenAPI-first for the backend to allow frontend/type generation.

## Onboarding & Documentation

- Keep a `README.md` per major folder (`api/`, `tablets/`, `scanner/`) with dev setup and run commands.
- Add API spec (OpenAPI) and a short `Getting Started` section for each service.

## Other tips / team norms

- Keep changes small and reviewable.
- When touching data models, include migration/compatibility notes.
- If unsure about a design choice, open a short ADR (architecture decision record).

## Contact & Ownership

- Add `CODEOWNERS` for critical paths if desired (e.g., `api/*` -> backend owners, `tablets/*` -> frontend owners).

---

Last updated: 2026-01-30
