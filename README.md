# SmartScholar

Multi-AI EdTech platform — AI-powered study tools, document analysis, exam generation, and forum moderation for university students.

## Tech Stack

| Layer   | Technology                                                         |
| ------- | ------------------------------------------------------------------ |
| Frontend | Next.js 16, Tailwind CSS v4, NextAuth v5, react-hook-form, Zod    |
| API      | Fastify v5, Prisma ORM, BullMQ + Redis, TypeScript                |
| Database | PostgreSQL + pgvector (AI embeddings)                              |
| AI       | Multi-provider (Groq, Gemini, OpenAI, Anthropic, Together AI)     |
| Infra    | Docker Compose, pnpm monorepo                                      |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10 (`npm i -g pnpm`)
- **Docker** + **Docker Compose** (for PostgreSQL + Redis)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd smartscholar
pnpm install

# 2. Copy environment files
cp .env.example apps/api/.env
cp .env.example apps/web/.env
cp .env.example packages/db/.env

# 3. Start services (PostgreSQL + Redis)
docker compose up -d db redis

# 4. Run database migrations
pnpm db:migrate

# 5. Seed database
pnpm db:seed

# 6. Start development servers (API :4000 + Web :3000)
pnpm dev
```

Open **http://localhost:3000** in your browser.

> **Note:** The API server requires `NODE_OPTIONS="--dns-result-order=ipv4first"` for Groq connectivity (already in the dev script).

## Default Credentials

| Role    | Email                    | Password    |
| ------- | ------------------------ | ----------- |
| Admin   | admin@smartscholar.com   | admin123    |
| Student | student@smartscholar.com | student123  |
| Student | jane@smartscholar.com    | student123  |

## Environment Variables

| Variable            | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `DATABASE_URL`      | Yes      | PostgreSQL connection string       |
| `REDIS_URL`         | Yes      | Redis connection string            |
| `JWT_SECRET`        | Yes      | JWT signing secret                 |
| `NEXTAUTH_SECRET`   | Yes      | NextAuth encryption secret         |
| `NEXTAUTH_URL`      | Yes      | Frontend URL (http://localhost:3000) |
| `NEXT_PUBLIC_API_URL` | Yes    | API URL (http://localhost:4000/api)  |
| `ALLOWED_ORIGINS`   | Yes      | CORS origins, comma-separated      |
| `OPENAI_API_KEY`    | No       | OpenAI key (moderation fallback)   |
| `GROQ_API_KEY`      | No       | Groq key (chat)                    |
| `GEMINI_API_KEY`    | No       | Gemini key (embeddings)            |

## Project Structure

```
smartscholar/
├── apps/
│   ├── api/          # Fastify API server (port 4000)
│   │   └── src/
│   │       ├── plugins/    # Auth, JWT, AI, CORS
│   │       ├── routes/     # API route handlers
│   │       └── lib/        # AI providers, RAG worker
│   └── web/          # Next.js frontend (port 3000)
│       └── src/
│           ├── app/        # App Router pages
│           │   ├── (dashboard)/  # User pages
│           │   └── admin/        # Admin pages
│           └── lib/        # Auth config, utilities
├── packages/
│   └── db/           # Prisma schema, migrations, seed
├── docker-compose.yml
└── package.json      # Root workspace scripts
```

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Start all apps in development mode   |
| `pnpm build`      | Build all apps                       |
| `pnpm db:generate`| Regenerate Prisma client             |
| `pnpm db:migrate` | Run database migrations              |
| `pnpm db:seed`    | Seed database with sample data       |
| `pnpm db:studio`  | Open Prisma Studio (DB GUI)          |

## API Endpoints

| Prefix | Auth | Description                          |
| ------ | ---- | ------------------------------------ |
| `/health` | No   | Health check                         |
| `/api/auth` | No | Login, register                     |
| `/api/courses` | Yes | Course listing                   |
| `/api/chat` | Yes | AI chat sessions + streaming        |
| `/api/exams` | Yes | Exam generation & sessions          |
| `/api/documents` | Yes | Document upload, processing       |
| `/api/forum` | Yes | Forum posts & replies               |
| `/api/notifications` | Yes | User notifications            |
| `/api/admin/*` | Admin | Admin CRUD operations           |
| `/api/providers` | Admin | AI provider management         |

## Deployment

### Production Build

```bash
pnpm build
docker compose up -d
```

The Docker compose setup includes the API, web frontend, PostgreSQL (pgvector), and Redis.

### Environment Variables for Production

Set the following in your deployment environment:

```
DATABASE_URL, REDIS_URL, JWT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL,
NEXT_PUBLIC_API_URL, ALLOWED_ORIGINS, GROQ_API_KEY, GEMINI_API_KEY
```

### Embedding Provider

The database vector column is configured for **3072 dimensions** (Gemini `gemini-embedding-2`). Switching providers requires altering the column and reprocessing documents.
