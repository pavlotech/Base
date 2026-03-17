# 🍽️ ChatBot Base

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)

Современный шаблон для Telegram ботов на основе Bun, TypeScript и модульной архитектуры, вдохновленной лучшими практиками Go.

## 🏗️ Архитектура проекта

Проект использует четкое разделение ответственности, что позволяет легко масштабировать и поддерживать код.

### Структура каталогов

- `cmd/` — Точки входа в приложение (Main entry points).
- `internal/` — Приватный код приложения, который не должен импортироваться внешними проектами.
    - `core/` — Базовые классы (`App`, `Loader`, `Router`), интерфейсы и системные перечисления.
    - `application/` — Бизнес-логика: модули, роуты, события и сцены.
    - `services/` — Специализированные сервисы (Gemini AI, Calorie service и др.).
    - `storage/` — Логика работы с хранилищами данных (Prisma, Redis).
- `pkg/` — Публичные утилиты и библиотеки, которые могут быть выделены в отдельные пакеты.
- `config/` — Конфигурационные файлы и инициализация окружения.
- `database/` — Схемы БД (Prisma) и миграции.

## 🛠️ Как пользоваться архитектурой

### 1. Добавление новой команды (Модуля)
Модули находятся в `internal/application/modules/`. Модуль создается путем создания нового экземпляра класса `Module`.

```typescript
// internal/application/modules/ping.module.ts
import Module from "@core/classes/module.class";

export default new Module(async (deps, config) => {
    deps.bot.command("ping", (ctx) => ctx.reply("Pong!"));
});
```

### 2. Создание роута (Route)
Роуты используются для обработки HTTP-запросов (например, для Web App). Находятся в `internal/application/routes/`.

```typescript
// internal/application/routes/web-app.route.ts
import Route from "@core/classes/route.class";

export default new Route(
    { path: "/api/status", method: "GET" },
    async (deps, request, config) => {
        return Response.json({ status: "ok" });
    }
);
```

### 3. Использование сервисов
Сервисы инжектируются в приложение через `IBaseDeps` в `cmd/main.ts`. Чтобы добавить новый сервис:
1. Опишите его в `internal/services/`.
2. Добавьте его в интерфейс `IBaseDeps` в `internal/core/interfaces/deps.interface.ts`.
3. Инициализируйте и передайте его в `cmd/main.ts`.

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
docker-compose up -d
```

---
© 2026 Pavlotech. MIT License.
acker-bot .

# Запуск с docker-compose
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

## 🔒 Безопасность

- Валидация всех пользовательских данных
- Ограничения на размер загружаемых файлов (20MB для Gemini)
- Изоляция данных пользователей
- Логирование всех операций
- Таймауты для предотвращения зависания

## 📊 Мониторинг

- Структурированное логирование
- Отслеживание ошибок API
- Метрики использования команд
- Мониторинг уверенности AI анализа

## 🔧 Технологии

- **Runtime**: [Bun](https://bun.sh/) - быстрый JavaScript runtime
- **Language**: [TypeScript](https://www.typescriptlang.org/) - типизированный JavaScript
- **Bot Framework**: [Telegraf](https://telegraf.js.org/) - фреймворк для Telegram ботов
- **AI**: [Google Gemini](https://ai.google.dev/) - анализ изображений и видео
- **Database**: [SQLite](https://www.sqlite.org/) + [Prisma ORM](https://www.prisma.io/)
- **Cache**: [Redis](https://redis.io/) - in-memory хранилище
- **Containerization**: [Docker](https://www.docker.com/) + Docker Compose

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/AmazingFeature`)
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request (`git push origin feature/AmazingFeature`)

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [Issues](../../issues)
2. Создайте новый Issue с подробным описанием
3. Обратитесь к документации API

## 🔗 Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Telegraf.js](https://telegraf.js.org/)
- [Bun Documentation](https://bun.sh/docs)

## 📈 Roadmap

- [ ] Поддержка других AI провайдеров (OpenAI Vision, Claude)
- [ ] Интеграция с фитнес-трекерами
- [ ] Веб-интерфейс для статистики
- [ ] Система рекомендаций питания
- [ ] Групповые чаты и соревнования
- [ ] Интеграция с базами данных продуктов