# 🍽️ ChatBot Base

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)

Универсальный фреймворк для создания ботов (Telegram и др.), веб-бэкендов или полноценных монолитов. Построен на Bun, TypeScript и модульной архитектуре, вдохновленной лучшими практиками Go.

## 🏗️ Архитектура проекта

Проект использует четкое разделение ответственности. Фреймворк позволяет объединять логику чат-ботов и HTTP-сервера в одном приложении.

### Структура каталогов

- `cmd/` — Точки входа в приложение.
- `internal/` — Приватный код приложения.
    - `core/` — Базовые классы (`App`, `Loader`, `Router`), интерфейсы и системные перечисления.
    - `application/` — Бизнес-логика: модули, роуты, события и сцены.
    - `services/` — Специализированные сервисы (AI, бизнес-логика и др.).
    - `storage/` — Логика работы с хранилищами данных (Prisma, Redis).
- `pkg/` — Публичные утилиты и библиотеки.
- `config/` — Конфигурационные файлы.
- `database/` — Схемы БД (Prisma) и миграции.

## 🛠️ Как пользоваться архитектурой

### 1. Добавление модуля (Module)
Модули — это строительные блоки приложения. Они загружаются автоматически. События (`ModuleType.EVENT`) загружаются в последнюю очередь, чтобы гарантировать готовность всех зависимостей.

```typescript
// internal/application/modules/example.module.ts
import Module, { ModuleType } from "@core/classes/module.class";

export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
    // Ваша логика здесь
});
```

### 2. Создание сцены (Scene)
Сцены используются для сложных диалогов в ботах. В параметрах передается `name`, а внутри доступны методы Telegraf и `deps.scene`.

```typescript
// internal/application/scenes/order.scene.ts
export default new Scene({ name: "order_scene" }, async (deps, config) => {
    deps.scene.enter(async (ctx) => {
        await ctx.reply("Что вы хотите заказать?");
    });
    // Обработка шагов сцены
});
```

### 3. Создание роута (Route)
Для создания API или бэкенда для сайта используйте роуты.

```typescript
import Route from "@core/classes/route.class";

export default new Route(
    { path: "/api/status", method: "GET" },
    async (deps, request, config) => {
        return Response.json({ status: "ok" });
    }
);
```

## 🤖 Использование Telegram Bot

По умолчанию поддержка Telegraf отключена в базовой версии для универсальности. Чтобы активировать её:

1. **Установите библиотеку:**
   ```bash
   bun add telegraf
   ```
2. **Активируйте файлы ядра:**
   Переименуйте файлы, убрав расширение `.disabled`:
   - `internal/core/classes/scene.class.ts.disabled`
   - `internal/core/interfaces/context.interface.ts.disabled`
   - `internal/core/interfaces/scene.interface.ts.disabled`
3. **Раскомментируйте код:**
   - В `internal/core/classes/loader.class.ts` раскомментируйте метод `loadScenes`.
   - В `internal/core/interfaces/deps.interface.ts` раскомментируйте импорты Telegraf и интерфейс `ISceneDeps`.
4. **Настройте App:**
   В `internal/core/classes/app.class.ts` добавьте инициализацию сессий и сцен (middleware) перед загрузкой модулей.

## 🚀 Быстрый старт

### Предварительные требования
- [Bun](https://bun.sh/) runtime
- Redis
- PostgreSQL/SQLite (через Prisma)

### Установка
1. Клонируйте репозиторий.
2. Установите зависимости: `bun install`.
3. Настройте `.env` (используя `env.example`).
4. Подготовьте БД: `bun run db:migrate && bun run db:generate`.
5. Запустите: `bun run dev`.

## 📈 Список скриптов

- `bun run dev` — Запуск в режиме разработки с hot-reload.
- `bun run start` — Запуск в production.
- `bun run db:*` — Команды для работы с Prisma (migrate, generate, studio).
- `bun run format` — Форматирование кода через Prettier.

## 🐳 Docker
Проект включает `Dockerfile` и `docker-compose.yml` для быстрого развертывания в контейнерах.

```bash
# Запуск через docker-compose
docker-compose up -d

# Логи
docker-compose logs -f bot
```

### Переменные окружения для продакшена

```env
NODE_ENV=production
LOG_LEVEL=warn
BOT_TOKEN=your_production_bot_token
GEMINI_API_KEY=your_production_gemini_key
REDIS_URL=redis://your-redis-server:6379
```

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

---
© 2026 Pavlotech. MIT License.
