# ePortfolio

Full-stack portfolio platform with private workspace and public profile sharing.

## What is implemented

- Authentication with Clerk JWT on backend APIs
- Portfolio modules: projects, certificates, CV builder
- Public profile endpoint with privacy enforcement (`isPublic`)
- Account settings API (`/api/users/me/settings`) and frontend sync
- Backend analytics for public views and owner events
- Notifications with create-once semantics and DB uniqueness
- AI text improvement endpoints with retry/fallback
- File uploads to Cloudinary with strict validation and rate limiting
- Request-level logging with propagated `X-Request-Id`

## Stack

- Backend: Java 17, Spring Boot 3, Spring Security OAuth2 Resource Server, Spring Data JPA, PostgreSQL, Redis, Flyway, Actuator, Prometheus metrics
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Clerk, Axios
- Infra: Docker, Docker Compose, Nginx

## Repository layout

```text
backend/                 Spring Boot API
frontend/                React app
docker-compose.yml       Full stack: Postgres + Redis + Backend + Frontend
backend/docker-compose.yml  Backend dependencies only (Postgres + Redis)
ARCHITECTURE.md          Architecture and data flow notes
```

## Quick start (Docker)

1. Create env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

2. Fill `backend/.env` secrets (`CLERK_ISSUER_URI`, `OPENAI_API_KEY`, Cloudinary keys, etc).

3. Build and run:

```bash
docker compose up --build -d
```

4. Open services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Actuator health: `http://localhost:8080/actuator/health`
- Prometheus metrics: `http://localhost:8080/actuator/prometheus`

Stop:

```bash
docker compose down
```

Remove volumes:

```bash
docker compose down -v
```

## Local development

### Backend dependencies only

```bash
docker compose -f backend/docker-compose.yml up -d
```

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

## Testing and quality

Backend:

```bash
cd backend
./mvnw test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Logging and observability

- Unified backend logs with request correlation (`reqId` from `X-Request-Id`)
- Request logging filter logs method, path, status, latency, client IP
- Actuator endpoints enabled: `health`, `info`, `prometheus`

## Security notes

- Do not commit `.env` files with real secrets
- Public portfolio endpoint does not expose owner email
- Upload API validates both metadata and file signatures (magic bytes)
- API rate limiting is available in-memory and Redis-backed modes

## Additional docs

- [Architecture](./ARCHITECTURE.md)
