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
        return Response.json({ status: "o## 🐳 Docker
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

## 🔒 Безопасность

- Валидация всех пользовательских данных
- Ограничения на размер загружаемых файлов
- Изоляция данных пользователей
- Логирование всех операций
- Таймауты для предотвращения зависания

## 🔧 Технологии

- **Runtime**: [Bun](https://bun.sh/) — быстрый JavaScript runtime
- **Language**: [TypeScript](https://www.typescriptlang.org/) — типизированный JavaScript
- **Bot Framework**: [Telegraf](https://telegraf.js.org/) — фреймворк для Telegram ботов
- **AI**: [Google Gemini](https://ai.google.dev/) — анализ изображений и видео
- **Database**: [Prisma ORM](https://www.prisma.io/)
- **Cache**: [Redis](https://redis.io/) — in-memory хранилище
- **Containerization**: [Docker](https://www.docker.com/)

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

---
© 2026 Pavlotech. MIT License.
�ности AI анализа

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