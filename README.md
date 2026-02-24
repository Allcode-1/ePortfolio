# ePortfolio (Spring Boot + React)

`ePortfolio` is a full-stack portfolio platform where users can manage certificates, CVs, projects, public profile links, analytics, AI text improvements, and system notifications.

This repository contains:
- `backend`: Java Spring Boot API
- `frontend`: React + TypeScript UI
- `docker-compose.yml`: full local deployment (PostgreSQL + Backend + Frontend)

## Core Features

- Dashboard with profile summary and portfolio counters
- Certificates management: upload, list, filter, delete
- CV Builder: multi-document flow, compare, PDF export
- Projects: GitHub autofill, details page, filtering
- Public profile page with shareable link
- Statistics page with activity metrics
- Real backend notifications (read/read-all)
- AI assistant endpoints for improving CV/Project/Certificate text
- RU/EN language switch

## Tech Stack

Backend:
- Java 17
- Spring Boot 3
- Spring Security OAuth2 Resource Server (Clerk JWT)
- Spring Data JPA + PostgreSQL
- Cloudinary (file storage)
- OpenAI API (AI text improvements)
- Maven

Frontend:
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Clerk (auth)
- Axios
- jsPDF

Infrastructure:
- Docker + Docker Compose
- Nginx (frontend container)

## Project Structure

```text
ePortofolio/
  backend/                # Spring Boot API
  frontend/               # React app
  docker-compose.yml      # Full stack local deploy
  .env.example            # Root compose/build env example
```

## Environment Setup

### 1 Backend env

```bash
cp backend/.env.example backend/.env
```

Fill `backend/.env` with real values:
- `CLERK_ISSUER_URI`
- `GITHUB_API_TOKEN`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_MAX_RETRIES`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### 2 Root env for Docker frontend build args

```bash
cp .env.example .env
```

Fill:
- `VITE_CLERK_PUBLISHABLE_KEY`

### 3 Frontend env for local non-docker run

```bash
cp frontend/.env.example frontend/.env
```

## Run with Docker (Recommended)

Build and run all services:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

Endpoints:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- PostgreSQL: `localhost:5432`

## Local Development (Without Docker)

### Backend

Option A: run only database in docker

```bash
docker compose up -d db
```

Then run backend:

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
npm ci
npm run dev
```

Frontend dev server: `http://localhost:5173`

## Useful Commands

Backend:

```bash
cd backend
./mvnw -DskipTests compile
./mvnw test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Security Notes

- Keep all real tokens/secrets only in `.env` files.
- Never hardcode secrets in Java/TS code.
- If any token was exposed earlier, rotate it immediately.

## JVM Crash Logs (hs_err_pid / replay_pid)

If JVM crashes, files like `hs_err_pid*.log` and `replay_pid*.log` may appear in repo root.  
They are local crash dumps and should not be committed.

Current setup already ignores them in `.gitignore`.

## Removing Old Crash Logs from Git History

If log files were already pushed in old commits, use history rewrite:

```bash
git filter-repo --path-glob "hs_err_pid*.log" --path-glob "replay_pid*.log" --invert-paths
git push --force --all
git push --force --tags
```

Run this only if you understand force-push impact on collaborators.
