# 🍽️ ChatBot Base

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)

A universal framework for creating bots (Telegram, etc.), web backends, or full-scale monoliths. Built with Bun, TypeScript, and a modular architecture inspired by Go best practices.

## 🏗️ Project Architecture

The project uses a clear separation of concerns. The framework allows combining chat-bot logic and an HTTP server in a single application.

### Directory Structure

- `cmd/` — Application entry points.
- `internal/` — Private application code.
    - `core/` — Base classes (`App`, `Loader`, `Router`), interfaces, and system enums.
    - `application/` — Business logic: modules, routes, events, and scenes.
    - `services/` — Specialized services (AI, business logic, etc.).
    - `storage/` — Data storage logic (Prisma, Redis).
- `pkg/` — Public utilities and libraries.
- `config/` — Configuration files.
- `database/` — DB schemas (Prisma) and migrations.

## 🛠️ How to Use the Architecture

### 1. Adding a Module
Modules are the building blocks of the application. They are loaded automatically. Events (`ModuleType.EVENT`) are loaded last to ensure all dependencies are ready.

```typescript
// internal/application/modules/example.module.ts
import Module, { ModuleType } from "@core/classes/module.class";

export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
    // Your logic here
});
```

### 2. Creating a Scene
Scenes are used for complex bot dialogues. The `name` is passed in the parameters, and Telegraf methods and `deps.scene` are available inside.

```typescript
// internal/application/scenes/order.scene.ts
export default new Scene({ name: "order_scene" }, async (deps, config) => {
    deps.scene.enter(async (ctx) => {
        await ctx.reply("What would you like to order?");
    });
    // Handle scene steps
});
```

### 3. Creating a Route
Use routes to create an API or a backend for a website.

```typescript
import Route from "@core/classes/route.class";

export default new Route({ path: "/api/status", method: "GET" }, async (deps, request, config) => {
    return Response.json({ status: "ok" });
});
```

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) runtime
- Redis
- PostgreSQL/SQLite (via Prisma)

### Installation
1. Clone the repository.
2. Install dependencies: `bun install`.
3. Configure `.env` (using `env.example`).
4. Prepare the DB: `bun run db:migrate && bun run db:generate`.
5. Start: `bun run dev`.

## 📈 Script List

- `bun run dev` — Start in development mode with hot-reload.
- `bun run start` — Start in production.
- `bun run db:*` — Commands for working with Prisma (migrate, generate, studio).
- `bun run format` — Format code via Prettier.

## 🐳 Docker
The project includes a `Dockerfile` and `docker-compose.yml` for quick deployment in containers.

```bash
# Start with docker-compose
docker-compose up -d

# Logs
docker-compose logs -f bot
```

### Production Environment Variables

```env
NODE_ENV=production
LOG_LEVEL=warn
BOT_TOKEN=your_production_bot_token
GEMINI_API_KEY=your_production_gemini_key
REDIS_URL=redis://your-redis-server:6379
```

## 🔒 Security

- Validation of all user data
- File size limits for uploads
- User data isolation
- Logging of all operations
- Timeouts to prevent hanging

## 🔧 Technologies

- **Runtime**: [Bun](https://bun.sh/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bot Framework**: [Telegraf](https://telegraf.js.org/)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **Database**: [Prisma ORM](https://www.prisma.io/)
- **Cache**: [Redis](https://redis.io/)
- **Containerization**: [Docker](https://www.docker.com/)

## 📄 License

This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
© 2026 Pavlotech. MIT License.
