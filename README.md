# StarShop - Интернет-магазин онлайн товаров для Telegram

Полноценный интернет-магазин для Telegram Mini App, специализирующийся на донатах в игры и подписках на сервисы для жителей Приднестровья.

## Технологический стек

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL с Prisma ORM
- **File Storage**: Vercel Blob
- **Telegram**: Telegram Mini App SDK, Telegram Bot API
- **Deployment**: Vercel

## Возможности

### Для пользователей
- 🛍️ Просмотр каталога игр и сервисов
- 💰 Оформление заказов с выбором способа оплаты
- 📸 Загрузка скриншотов оплаты
- 📦 Отслеживание статуса заказов
- ⭐ Система отзывов
- 👤 Личный профиль

### Для администраторов
- 📊 Детальная статистика по заказам и выручке
- ✏️ Редактирование товаров (цены, скидки) прямо в таблице
- 🔔 Уведомления о новых заказах в Telegram
- ✅ Управление статусом заказов
- 📢 Автоматическая публикация отзывов в канал

## Установка и запуск

### 1. Клонирование и установка зависимостей

\`\`\`bash
git clone <repository-url>
cd internet-shop-tg
bun install
\`\`\`

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/internet_shop_tg?schema=public"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_bot_token_here"
TELEGRAM_ADMIN_CHAT_ID="your_admin_chat_id"
TELEGRAM_CHANNEL_ID="your_channel_id_for_reviews"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"
\`\`\`

### 3. Настройка базы данных

\`\`\`bash
# Создание миграций
bunx prisma migrate dev --name init

# Генерация Prisma Client
bunx prisma generate

# (Опционально) Заполнение тестовыми данными
bunx prisma db seed
\`\`\`

### 4. Запуск в режиме разработки

\`\`\`bash
bun dev
\`\`\`

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## Структура базы данных

### User (Пользователи)
- `id` - Уникальный идентификатор
- `telegramId` - ID пользователя в Telegram
- `username` - Юзернейм в Telegram
- `firstName`, `lastName` - Имя пользователя
- `createdAt`, `updatedAt` - Даты создания и обновления

### Product (Товары)
- `id` - Уникальный идентификатор
- `name` - Название товара
- `description` - Описание
- `category` - Категория (GAME/SERVICE)
- `gameType` - Тип игры (MOBILE_LEGENDS, PUBG_MOBILE, etc.)
- `image` - URL изображения
- `basePrice`, `currentPrice` - Базовая и текущая цена
- `discount` - Процент скидки
- `isActive` - Активность товара
- `sortOrder` - Порядок сортировки

### Order (Заказы)
- `id` - Уникальный идентификатор
- `orderNumber` - Номер заказа
- `userId`, `productId` - Связи с пользователем и товаром
- `paymentMethod` - Способ оплаты (APB_TRANSFER/CARD_TRANSFER)
- `paymentScreenshot` - URL скриншота оплаты
- `amount` - Сумма заказа
- `status` - Статус (PENDING/PAID/PROCESSING/COMPLETED/REJECTED)
- `playerInfo` - Данные игрока (JSON)
- `completedAt` - Дата завершения

### Review (Отзывы)
- `id` - Уникальный идентификатор
- `orderId`, `userId` - Связи с заказом и пользователем
- `rating` - Оценка (1-5)
- `comment` - Текст отзыва

## Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота и добавьте в `.env`
3. Настройте webhook для получения уведомлений:

\`\`\`bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
\`\`\`

4. Получите ID чата администратора:
   - Отправьте боту любое сообщение
   - Откройте https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   - Найдите поле `chat.id`

## Деплой на Vercel

1. Подключите проект к Vercel:

\`\`\`bash
vercel
\`\`\`

2. Добавьте переменные окружения в настройках проекта Vercel

3. Настройте PostgreSQL database (рекомендуется Vercel Postgres или Supabase)

4. Деплой:

\`\`\`bash
vercel --prod
\`\`\`

## API Routes

### Products
- `GET /api/products` - Получить список товаров
- `GET /api/products/[id]` - Получить товар по ID
- `PATCH /api/products/[id]` - Обновить товар (админ)

### Orders
- `GET /api/orders?userId=<id>` - Получить заказы пользователя
- `POST /api/orders` - Создать новый заказ
- `GET /api/orders/[id]` - Получить заказ по ID
- `PATCH /api/orders/[id]` - Обновить статус заказа (админ)

### Reviews
- `GET /api/reviews?productId=<id>` - Получить отзывы на товар
- `POST /api/reviews` - Создать отзыв

### Admin
- `GET /api/admin/stats` - Получить статистику

### Other
- `POST /api/upload` - Загрузить файл
- `POST /api/auth/telegram` - Аутентификация через Telegram
- `POST /api/telegram/webhook` - Webhook для Telegram бота

## Разработка

### Структура проекта

\`\`\`
app/
├── api/              # API routes
├── admin/            # Админ панель
├── orders/           # Страницы заказов
├── product/[id]/     # Страница товара
├── profile/          # Профиль пользователя
├── layout.tsx        # Root layout
└── page.tsx          # Главная страница

components/           # React компоненты
lib/                  # Утилиты и хелперы
prisma/              # Схема БД и миграции
providers/           # React providers
types/               # TypeScript типы
\`\`\`

### Команды разработки

\`\`\`bash
# Запуск dev сервера
bun dev

# Форматирование кода
bunx prettier --write .

# Линтинг
bun run lint

# Работа с Prisma
bunx prisma studio        # Открыть Prisma Studio
bunx prisma migrate dev   # Создать миграцию
bunx prisma db push      # Применить изменения схемы
\`\`\`

## Лицензия

MIT
