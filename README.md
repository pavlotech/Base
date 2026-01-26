# 🍽️ baseBot

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

Telegram бот для автоматического подсчета калорий с анализом фото и видео еды через Google Gemini AI.

## ✨ Возможности

- 📸 **Анализ фото еды** - автоматическое определение блюда и калорий
- 🎥 **Анализ видео** - поддержка обычных видео и видео-кружков
- 📊 **Статистика** - подсчет калорий по дням, неделям и месяцам
- 👤 **Профиль пользователя** - настройка целей и параметров
- 📤 **Экспорт данных** - выгрузка истории в CSV
- 🔄 **Сброс данных** - возможность начать заново
- 🌐 **Многоязычность** - поддержка русского и английского языков
- 🤖 **AI анализ** - точное определение еды через Google Gemini

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ или Bun
- Redis сервер
- Telegram Bot Token
- Google Gemini API ключ

### Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd baseBot
```

2. **Установите зависимости:**
```bash
bun install
# или
npm install
```

3. **Настройте переменные окружения:**
```bash
cp .env.example .env
```

Отредактируйте `.env` файл:
```env
BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL="file:./database/data.db"
REDIS_URL=redis://localhost:6379
NODE_ENV=development
LOG_LEVEL=info
```

4. **Настройте базу данных:**
```bash
bun run db:migrate
bun run db:generate
```

5. **Запустите Redis:**
```bash
# Через Docker
docker run -d -p 6379:6379 redis:alpine

# Или через docker-compose (если есть)
docker-compose up -d redis
```

6. **Запустите бота:**
```bash
bun run dev
# или
npm run dev
```

## 🔧 Настройка

### Получение Telegram Bot Token

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен в `.env`

### Получение Google Gemini API ключа

1. Перейдите на [Google AI Studio](https://aistudio.google.com/)
2. Войдите в аккаунт Google
3. Создайте новый API ключ
4. Скопируйте ключ в `.env`

## 📱 Использование

### Команды бота

- `/start` - Начать работу с ботом
- `/help` - Справка по использованию
- `/stats` - Показать статистику калорий
- `/profile` - Настроить профиль пользователя
- `/reset` - Сбросить все данные
- `/export` - Экспортировать данные в CSV
- `/subscribe` - Информация о премиум подписке

### Анализ еды

1. **Отправьте фото еды** - бот автоматически определит блюдо и калории
2. **Отправьте видео** - поддерживаются обычные видео и видео-кружки
3. **Опишите текстом** - если AI не смог точно определить еду

### Примеры использования

```
Пользователь: [отправляет фото пиццы]
Бот: *Распознана еда*

🍽️ **Пицца Маргарита**
🔥 **320 ккал**
📏 **Порция:** 1 кусок (120г)

Калории добавлены в вашу статистику!
```

## 🏗️ Архитектура

Проект построен на модульной архитектуре:

```
src/
├── application/          # Бизнес-логика
│   ├── modules/         # Модули команд бота
├── core/                # Базовые классы и интерфейсы
│   ├── classes/         # Базовые классы
│   ├── enums/           # Перечисления
│   └── interfaces/      # TypeScript интерфейсы
├── infrastructure/      # Внешние сервисы
│   ├── services/        # Сервисы (Gemini, Calorie)
│   └── storage/         # Хранилища (Redis, Prisma)
└── utils/               # Утилиты
    ├── locale/          # Локализация
    └── logger.util.ts   # Логирование
```

### Основные компоненты

- **GeminiService** - интеграция с Google Gemini AI для анализа изображений
- **CalorieService** - управление данными о калориях и статистике
- **Module система** - автоматическая загрузка модулей команд
- **Prisma ORM** - работа с базой данных SQLite
- **Redis** - кэширование и временные данные

## 🗄️ База данных

Схема базы данных включает:

- **User** - пользователи бота
- **Telegram** - данные Telegram профилей
- **UserProfile** - настройки и цели пользователей
- **FoodEntry** - записи о съеденной еде
- **DailyStats** - дневная статистика калорий

## 🛠️ Скрипты разработки

```bash
# Запуск в режиме разработки
bun run dev

# Запуск в продакшене
bun run start

# Линтинг
bun run lint

# Форматирование кода
bun run format
```

### Работа с базой данных

```bash
# Генерация Prisma клиента
bun run db:generate

# Создание и применение миграций
bun run db:migrate

# Применение миграций в продакшене
bun run db:deploy

# Открытие Prisma Studio
bun run db:studio

# Сброс базы данных
bun run db:reset
```

## 🐳 Docker развертывание

```bash
# Сборка образа
docker build -t calorie-tracker-bot .

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