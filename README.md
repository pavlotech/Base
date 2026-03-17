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

## 🤖 Using Telegram Bot

By default, Telegraf support is disabled in the base version for universality. To activate it:

1. **Install the library:**
   ```bash
   bun add telegraf
   ```
2. **Activate core files:**
   Rename files by removing the `.disabled` extension:
   - `internal/core/classes/scene.class.ts.disabled`
   - `internal/core/interfaces/context.interface.ts.disabled`
   - `internal/core/interfaces/scene.interface.ts.disabled`
3. **Uncomment code:**
   - In `internal/core/interfaces/deps.interface.ts`, uncomment Telegraf imports and the `ISceneDeps` interface:
     ```typescript
     import { Telegraf, Scenes } from "telegraf";
     // ...
     export interface ISceneDeps extends IBaseDeps {
         scene: Scenes.BaseScene<any>;
     }
     ```
   - In `internal/core/classes/loader.class.ts`, uncomment the `loadScenes` method:
     ```typescript
     public async loadScenes(): Promise<Scenes.BaseScene<any>[]> {
         const sceneFiles = this.getFiles(this.scenesPath, this.suffix);
         const scenes: Scenes.BaseScene<any>[] = [];
         // ...
         return scenes;
     }
     ```
4. **Configure App:**
   In `internal/core/classes/app.class.ts`, add session and scene initialization (middleware) before loading modules:
   ```typescript
   const scenes = await this.loader.loadScenes();
   const stage = new Scenes.Stage(scenes, { ttl: config.stage.ttl });
   
   this.deps.bot.use(session());
   this.deps.bot.use(stage.middleware());
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

## 📄 License

This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
© 2026 Pavlotech. MIT License.
