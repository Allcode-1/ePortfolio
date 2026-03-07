# Architecture

## High-level overview

`ePortfolio` uses a split architecture:

- `frontend` (React SPA) for UX
- `backend` (Spring Boot REST API) for business logic and persistence
- `postgres` for primary data
- `redis` for optional distributed rate limiting and analytics dedupe
- `cloudinary` for file storage
- `openai` for AI text improvements

## Backend layers

- `controllers`: HTTP layer and auth context extraction
- `services`: business rules, validation, integration logic
- `repositories`: Spring Data JPA access
- `models`: JPA entities
- `dto`: API payload contracts
- `exceptions`: global API error mapping
- `logging`: request correlation and access logs

## Auth model

- Spring Security OAuth2 Resource Server validates JWTs from Clerk issuer.
- Public endpoints:
  - `/api/public/**`
  - `/api/analytics/public-view/**`
- All other API routes require JWT.

## Core data model

- `users`
- `projects`
- `certificates`
- `cvs`, `experience`, `education`, `cv_skills`
- `notifications` (unique `(user_id, type)` for create-once events)
- `portfolio_analytics`, `portfolio_analytics_monthly`

Schema is managed by Flyway (`backend/src/main/resources/db/migration`).

## Key request flows

### Private profile operations

1. Frontend sends JWT in `Authorization: Bearer ...`
2. Backend resolves user from JWT subject (Clerk ID)
3. Services perform owner-scoped CRUD on projects/certificates/cv

### Public portfolio view

1. Frontend requests `/api/public/portfolio/{userId}`
2. Backend checks `user.isPublic == true`
3. Returns sanitized portfolio (owner email hidden)
4. Frontend tracks `/api/analytics/public-view/{userId}`
5. Backend increments owner analytics with dedupe and rate limiting

### CV sync

1. Frontend keeps local CV document variants for UX
2. Primary CV is persisted to backend via `/api/cv`
3. UI updates local state only after successful backend sync

## Reliability and security controls

- Global exception mapping with explicit API codes/messages
- Request correlation id (`X-Request-Id`) + structured log pattern
- Upload validation:
  - max file size
  - allowed extensions/content types
  - magic-byte signature checks
- Rate limiting:
  - in-memory default
  - Redis optional mode for distributed deployment
- Analytics public-view dedupe:
  - in-memory default
  - Redis optional mode for distributed deployment

## Deployment model

`docker-compose.yml` runs:

- `db` (PostgreSQL)
- `redis`
- `backend` (Spring Boot, port `8080`)
- `frontend` (Nginx serving SPA + proxy `/api` to backend, port `5173`)

For backend-only local development, `backend/docker-compose.yml` runs only `db` and `redis`.

## Observability

- Actuator endpoints exposed: `health`, `info`, `prometheus`
- Prometheus metrics registry enabled via Micrometer
- Request logs include method, URI, status, latency, IP, user-agent

## Known tradeoffs / future improvements

- Frontend still stores some non-critical UI preferences in `localStorage`
- Background jobs/queues are not yet introduced
- No dedicated centralized log sink (ELK/Loki) out of the box
- Frontend automated tests are still minimal compared to backend coverage
