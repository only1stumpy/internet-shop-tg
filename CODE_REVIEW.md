# StarShop - Комплексное Код-Ревью

**Дата ревью**: 2025-11-16
**Ревьюер**: Claude Code
**Проект**: StarShop Telegram Mini App E-commerce Platform

---

## Краткое Резюме

Данное комплексное код-ревью выявило **43 проблемы** в кодовой базе, приоритизированные по степени важности:

- **7 КРИТИЧЕСКИХ** - Срочные уязвимости безопасности, требующие немедленного исправления
- **9 ВЫСОКИХ** - Важные проблемы, влияющие на функциональность и безопасность
- **19 СРЕДНИХ** - Улучшения качества кода и соблюдения best practices
- **8 НИЗКИХ** - Незначительные оптимизации и улучшения

**Основные Проблемы**:
1. Отсутствие аутентификации на критичных API эндпоинтах
2. Небезопасная валидация данных и доверие к клиентским данным
3. Функционал админки без проверки авторизации
4. Потенциальные race conditions при обработке заказов
5. Пробелы в TypeScript type safety

---

## Содержание

1. [Критические Проблемы](#критические-проблемы)
2. [Проблемы Высокого Приоритета](#проблемы-высокого-приоритета)
3. [Проблемы Среднего Приоритета](#проблемы-среднего-приоритета)
4. [Проблемы Низкого Приоритета](#проблемы-низкого-приоритета)
5. [План Исправлений](#план-исправлений)

---

## Критические Проблемы

### 🔴 КРИТИЧНО-1: Отсутствие Аутентификации на API Эндпоинтах

**Файлы**:
- `app/api/products/route.ts`
- `app/api/orders/route.ts`
- `app/api/reviews/route.ts`
- `app/api/variants/route.ts`

**Проблема**: Множественные API эндпоинты не имеют валидации Telegram initData, что позволяет несанкционированный доступ.

**Пример** (`app/api/orders/route.ts:54-84`):
```typescript
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { orderId, status } = body;

  // ❌ Нет проверки аутентификации!
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}
```

**Риск**: Атакующие могут манипулировать заказами, создавать фальшивые отзывы или получать доступ к конфиденциальным данным без аутентификации.

**Рекомендация**:
```typescript
import { extractTelegramInitData, validateTelegramAuth } from "@/lib/telegramAuth";

export async function PATCH(request: NextRequest) {
  // ✅ Добавить аутентификацию
  const initData = await extractTelegramInitData(request);
  if (!initData || !validateTelegramAuth(initData)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  // Продолжить бизнес-логику...
}
```

---

### 🔴 КРИТИЧНО-2: Несанкционированный Доступ к Заказам

**Файл**: `app/api/orders/route.ts:24-52`

**Проблема**: GET эндпоинт принимает `userId` из query параметров без проверки, что аутентифицированный пользователь владеет этими данными.

**Код**:
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  // ❌ Доверяем userId от клиента!
  const orders = await prisma.order.findMany({
    where: userId ? { userId } : undefined,
  });
}
```

**Риск**: Любой пользователь может просматривать заказы других пользователей, изменив параметр `userId`.

**Рекомендация**:
```typescript
export async function GET(request: NextRequest) {
  const initData = await extractTelegramInitData(request);
  if (!initData || !validateTelegramAuth(initData)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const telegramUser = parseTelegramInitData(initData._raw || "");

  // ✅ Используем ID аутентифицированного пользователя
  const user = await prisma.user.findUnique({
    where: { telegramId: telegramUser.id.toString() }
  });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
  });
}
```

---

### 🔴 КРИТИЧНО-3: Эндпоинты Админки Без Авторизации

**Файлы**:
- `app/api/admin/stats/route.ts`
- `app/api/products/route.ts` (PATCH, DELETE)
- `app/api/variants/[id]/route.ts` (PATCH, DELETE)

**Проблема**: Операции только для админов не имеют контроля доступа на основе ролей.

**Код** (`app/api/admin/stats/route.ts:3`):
```typescript
export async function GET() {
  // ❌ Любой может получить доступ к статистике админа!
  const totalUsers = await prisma.user.count();
  // ...
}
```

**Риск**: Неавторизованные пользователи могут получить доступ к конфиденциальным бизнес-данным и изменять продукты/варианты.

**Рекомендация**:
1. Добавить поле `isAdmin` в модель User
2. Создать middleware для админов:
```typescript
// lib/adminAuth.ts
export async function requireAdmin(request: Request) {
  const initData = await extractTelegramInitData(request);
  if (!initData || !validateTelegramAuth(initData)) {
    return { authorized: false, error: "Не авторизован" };
  }

  const telegramUser = parseTelegramInitData(initData._raw || "");
  const user = await prisma.user.findUnique({
    where: { telegramId: telegramUser.id.toString() }
  });

  if (!user?.isAdmin) {
    return { authorized: false, error: "Запрещено - требуется доступ администратора" };
  }

  return { authorized: true, user };
}
```

---

### 🔴 КРИТИЧНО-4: Подпись Telegram Webhook Не Валидируется

**Файл**: `app/api/telegram/webhook/route.ts:8-69`

**Проблема**: Webhook не проверяет, что запросы действительно приходят от Telegram.

**Код**:
```typescript
export async function POST(req: Request) {
  const body = await req.json();

  // ❌ Нет валидации подписи!
  if (body.callback_query) {
    const callbackQuery = body.callback_query;
    // Обработка callback...
  }
}
```

**Риск**: Атакующие могут отправлять фальшивые webhook запросы для манипуляции статусами заказов.

**Рекомендация**:
```typescript
import crypto from "crypto";

function validateWebhookSignature(body: string, token: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", token)
    .update(body)
    .digest("hex");
  return hash === signature;
}

export async function POST(req: Request) {
  const signature = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  const rawBody = await req.text();

  if (!signature || !validateWebhookSignature(rawBody, process.env.WEBHOOK_SECRET!, signature)) {
    return NextResponse.json({ error: "Неверная подпись" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);
  // Продолжить обработку...
}
```

---

### 🔴 КРИТИЧНО-5: Небезопасное Доверие к User ID из localStorage

**Файл**: `app/product/[id]/page.tsx:103-108`

**Проблема**: User ID читается из localStorage без серверной проверки.

**Код**:
```typescript
const handleOrder = async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;

  const user = JSON.parse(userStr);
  // ❌ Доверяем данным на стороне клиента!
  const userId = user.id;
}
```

**Риск**: Пользователи могут манипулировать localStorage для создания заказов от имени других пользователей.

**Рекомендация**:
1. Никогда не доверяйте user ID на стороне клиента
2. Аутентифицируйте на сервере и извлекайте пользователя из initData:
```typescript
// Клиент отправляет initData, сервер валидирует и извлекает пользователя
const response = await fetch("/api/orders", {
  method: "POST",
  headers: {
    "X-Telegram-Init-Data": window.Telegram.WebApp.initData,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    productId,
    variantId,
    // Не отправляем userId!
  })
});
```

---

### 🔴 КРИТИЧНО-6: Загрузка Файлов Без Валидации

**Файл**: `app/api/upload/route.ts:8-33`

**Проблема**: Эндпоинт загрузки файлов не имеет аутентификации и валидации типа файлов.

**Код**:
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // ❌ Нет аутентификации!
  // ❌ Нет валидации типа файла!
  // ❌ Нет лимита размера файла!

  const blob = await put(file.name, file, { access: "public" });
}
```

**Риск**:
- Неограниченная загрузка файлов может исчерпать квоту хранилища
- Могут быть загружены вредоносные файлы
- Нет контроля затрат

**Рекомендация**:
```typescript
export async function POST(request: Request) {
  // ✅ Требуем аутентификацию
  const initData = await extractTelegramInitData(request);
  if (!initData || !validateTelegramAuth(initData)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  // ✅ Валидируем тип файла
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Неверный тип файла" }, { status: 400 });
  }

  // ✅ Валидируем размер файла (лимит 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Файл слишком большой" }, { status: 400 });
  }

  // ✅ Санитизируем имя файла
  const timestamp = Date.now();
  const sanitizedName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

  const blob = await put(sanitizedName, file, { access: "public" });
}
```

---

### 🔴 КРИТИЧНО-7: Необработанные Поля в PATCH Запросах

**Файлы**:
- `app/api/products/route.ts:45-85`
- `app/api/variants/[id]/route.ts:23-59`

**Проблема**: PATCH эндпоинты принимают все поля из request body без белого списка.

**Код**:
```typescript
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { productId, ...updateData } = body;

  // ❌ Спредит все поля, включая потенциально опасные!
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
}
```

**Риск**: Атакующие могут изменять защищенные поля как `createdAt`, `id`, или внедрять неожиданные поля.

**Рекомендация**:
```typescript
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { productId, name, description, image, isActive, sortOrder, currency } = body;

  // ✅ Явно белый список разрешенных полей
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (image !== undefined) updateData.image = image;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (currency !== undefined) updateData.currency = currency;

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
}
```

---

## Проблемы Высокого Приоритета

### 🟠 ВЫСОКИЙ-1: Race Condition при Создании Заказа

**Файл**: `app/product/[id]/page.tsx:103-156`

**Проблема**: Создание заказа не имеет изоляции транзакций и идемпотентности.

**Код**:
```typescript
const handleOrder = async () => {
  setIsOrdering(true);

  // ❌ Нет проверки на дубликаты заказов!
  // ❌ Не обернуто в транзакцию!

  const response = await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      userId,
      productId,
      variantId,
      // ...
    }),
  });
}
```

**Риск**: Двойное нажатие кнопки "Заказать" создает дублированные заказы.

**Рекомендация**:
```typescript
// Клиентская сторона: Отключить кнопку во время запроса
const handleOrder = async () => {
  if (isOrdering) return; // ✅ Предотвращаем двойной клик
  setIsOrdering(true);

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        // ✅ Добавляем ключ идемпотентности
        idempotencyKey: `${userId}-${Date.now()}`,
        // ...
      }),
    });
  } finally {
    setIsOrdering(false);
  }
}

// Серверная сторона: Проверка на дубликаты заказов
export async function POST(request: NextRequest) {
  const { userId, productId, variantId, idempotencyKey } = body;

  // ✅ Проверяем недавние дублирующие заказы
  const recentOrder = await prisma.order.findFirst({
    where: {
      userId,
      productId,
      variantId,
      createdAt: {
        gte: new Date(Date.now() - 60000) // В пределах последней минуты
      }
    }
  });

  if (recentOrder) {
    return NextResponse.json(recentOrder, { status: 200 });
  }

  // Создать новый заказ...
}
```

---

### 🟠 ВЫСОКИЙ-2: Отсутствует Error Boundary

**Файл**: `app/layout.tsx`

**Проблема**: Нет глобального error boundary для отлова ошибок React компонентов.

**Рекомендация**:
Создать `app/error.tsx`:
```typescript
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ошибка приложения:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Что-то пошло не так
        </h2>
        <button
          onClick={reset}
          className="px-6 py-3 bg-cerulean text-white rounded-lg"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
```

---

### 🟠 ВЫСОКИЙ-3: Prisma Client Не Правильно Singleton

**Файл**: `lib/prisma.ts:1-13`

**Проблема**: Инстанциация Prisma client может создать множественные экземпляры в разработке.

**Текущий Код**:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Рекомендация**: Добавить логирование и connection pooling:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

### 🟠 ВЫСОКИЙ-4: Отсутствует Валидация Environment Variables

**Проблема**: Нет валидации наличия требуемых переменных окружения при запуске.

**Рекомендация**: Создать `lib/env.ts`:
```typescript
const requiredEnvVars = [
  "DATABASE_URL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ADMIN_CHAT_ID",
  "TELEGRAM_CHANNEL_ID",
  "BLOB_READ_WRITE_TOKEN",
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Отсутствуют требуемые переменные окружения: ${missing.join(", ")}`
    );
  }
}

// Вызвать это в layout.tsx или middleware
```

---

### 🟠 ВЫСОКИЙ-5: Telegram Bot Не Правильно Инициализирован

**Файл**: `lib/telegram.ts:3-11`

**Проблема**: Экземпляр бота создается на уровне модуля без обработки ошибок.

**Код**:
```typescript
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: false,
});
```

**Рекомендация**:
```typescript
let bot: TelegramBot | null = null;

export function getBot(): TelegramBot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN не настроен");
    }

    bot = new TelegramBot(token, {
      polling: false,
      filepath: false, // Отключить загрузку файлов для безопасности
    });
  }

  return bot;
}

// Использовать getBot() вместо bot во всех функциях
```

---

### 🟠 ВЫСОКИЙ-6: Публикация Отзывов Без Санитизации

**Файл**: `lib/telegram.ts:49-69`

**Проблема**: Контент, созданный пользователем, отправляется в Telegram без санитизации.

**Код**:
```typescript
export async function sendReviewToChannel(review: ReviewData) {
  const message = `
⭐ Новый отзыв (${stars})

👤 ${review.username}
📅 ${review.orderDate}
🎮 ${review.productName}

💬 ${review.comment}
  `;

  // ❌ Нет санитизации пользовательского ввода!
  await bot.sendMessage(channelId, message);
}
```

**Риск**: Пользователи могут внедрять markdown, который ломает форматирование или включает вредоносные ссылки.

**Рекомендация**:
```typescript
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

export async function sendReviewToChannel(review: ReviewData) {
  const message = `
⭐ Новый отзыв (${stars})

👤 ${escapeMarkdown(review.username)}
📅 ${review.orderDate}
🎮 ${escapeMarkdown(review.productName)}

💬 ${escapeMarkdown(review.comment)}
  `;

  await bot.sendMessage(channelId, message, { parse_mode: "MarkdownV2" });
}
```

---

### 🟠 ВЫСОКИЙ-7: Нет Rate Limiting

**Проблема**: API эндпоинты уязвимы к злоупотреблениям через неограниченные запросы.

**Рекомендация**: Реализовать middleware rate limiting используя Vercel KV или Upstash:
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      { status: 429 }
    );
  }

  return NextResponse.next();
}
```

---

### 🟠 ВЫСОКИЙ-8: Переходы Статусов Заказов Не Валидируются

**Файл**: `app/api/orders/route.ts:54-84`

**Проблема**: Любой переход статуса разрешен без валидации.

**Код**:
```typescript
export async function PATCH(request: NextRequest) {
  const { orderId, status } = body;

  // ❌ Нет валидации перехода статуса!
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}
```

**Риск**: Заказы могут перейти из COMPLETED обратно в PENDING, ломая бизнес-логику.

**Рекомендация**:
```typescript
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "REJECTED"],
  PAID: ["PROCESSING", "REJECTED"],
  PROCESSING: ["COMPLETED", "REJECTED"],
  COMPLETED: [], // Терминальное состояние
  REJECTED: [], // Терминальное состояние
};

export async function PATCH(request: NextRequest) {
  const { orderId, status: newStatus } = body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  // ✅ Валидируем переход
  const allowedTransitions = VALID_TRANSITIONS[order.status];
  if (!allowedTransitions.includes(newStatus)) {
    return NextResponse.json(
      { error: `Невозможен переход из ${order.status} в ${newStatus}` },
      { status: 400 }
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
}
```

---

### 🟠 ВЫСОКИЙ-9: Запросы к БД Не Оптимизированы

**Файл**: `app/api/admin/stats/route.ts:3-36`

**Проблема**: Множественные последовательные запросы к БД могут быть распараллелены.

**Код**:
```typescript
export async function GET() {
  // ❌ Последовательные запросы
  const totalUsers = await prisma.user.count();
  const totalOrders = await prisma.order.count();
  const totalRevenue = await prisma.order.aggregate({...});
  const ordersByStatus = await prisma.order.groupBy({...});
}
```

**Рекомендация**:
```typescript
export async function GET() {
  // ✅ Параллельные запросы
  const [totalUsers, totalOrders, totalRevenue, ordersByStatus, recentOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { finalPrice: true },
        where: { status: "COMPLETED" },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: true, product: true },
      }),
    ]);
}
```

---

## Проблемы Среднего Приоритета

### 🟡 СРЕДНИЙ-1: Отсутствует TypeScript Strict Null Checks

**Файл**: Множественные файлы

**Проблема**: Необязательная цепочка используется чрезмерно вместо правильной обработки null.

**Пример**:
```typescript
const user = order.user;
const username = user?.username || "Аноним";
```

**Рекомендация**: Включить strict null checks в `tsconfig.json` и обрабатывать null явно.

---

### 🟡 СРЕДНИЙ-2: React Keys Используют Index

**Файл**: `app/admin/page.tsx:280`

**Проблема**: Использование индекса массива как React key может вызвать проблемы с рендерингом.

**Код**:
```typescript
{products.map((product, index) => (
  <div key={index}>...</div>
))}
```

**Рекомендация**:
```typescript
{products.map((product) => (
  <div key={product.id}>...</div>
))}
```

---

### 🟡 СРЕДНИЙ-3: Несогласованные Сообщения об Ошибках

**Проблема**: API ответы об ошибках смешивают английский и русский.

**Примеры**:
- `"Order not found"` (Английский)
- `"Заказ не найден"` (Русский)

**Рекомендация**: Стандартизировать все сообщения об ошибках на русский для согласованности с UI.

---

### 🟡 СРЕДНИЙ-4: Нет Loading States для Получения Данных

**Файл**: `app/orders/page.tsx`

**Проблема**: Страница заказов не показывает состояние загрузки во время начального получения данных.

**Рекомендация**: Добавить состояние загрузки:
```typescript
"use client";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        // Получить заказы...
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return <div>Загрузка заказов...</div>;
  }
}
```

---

### 🟡 СРЕДНИЙ-5: Жестко Закодированный Символ Валюты

**Файл**: Множественные файлы используют жестко закодированный `₽`

**Рекомендация**: Использовать поле product.currency последовательно:
```typescript
<span>{product.currency}{price}</span>
```

---

### 🟡 СРЕДНИЙ-6: Нет Оптимизации Изображений

**Файл**: `components/ProductCard.tsx`

**Проблема**: Изображения загружаются без оптимизации Next.js Image.

**Текущее**:
```typescript
<img src={product.image} alt={product.name} />
```

**Рекомендация**:
```typescript
import Image from "next/image";

<Image
  src={product.image}
  alt={product.name}
  width={200}
  height={200}
  className="rounded-lg"
  priority={index < 4} // Приоритет для первых 4 изображений
/>
```

---

### 🟡 СРЕДНИЙ-7: Дублированный Код Инициализации Telegram

**Файлы**:
- `providers/TelegramProvider.tsx`
- `lib/hooks/useTelegramUser.ts`

**Проблема**: Логика доступа к Telegram WebApp дублируется.

**Рекомендация**: Создать общую утилиту:
```typescript
// lib/telegramWebApp.ts
export function getTelegramWebApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
}

export function getTelegramUser() {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}
```

---

### 🟡 СРЕДНИЙ-8: Нет Миграций Базы Данных

**Проблема**: Использование `prisma db push` вместо миграций в продакшене.

**Текущее** (`vercel.json`):
```json
{
  "buildCommand": "prisma generate && prisma db push && npm run seed:conditional && next build"
}
```

**Рекомендация**: Переключиться на миграции для продакшена:
```bash
# Создать миграцию
bunx prisma migrate dev --name init

# Обновить vercel.json
{
  "buildCommand": "prisma generate && prisma migrate deploy && npm run seed:conditional && next build"
}
```

---

### 🟡 СРЕДНИЙ-9: Отсутствует .nvmrc или .node-version

**Проблема**: Версия Node не указана, может вызвать проблемы при развертывании.

**Рекомендация**: Добавить `.nvmrc`:
```
20.11.0
```

И указать в `package.json`:
```json
{
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.0.0"
  }
}
```

---

### 🟡 СРЕДНИЙ-10: Нет CORS Конфигурации

**Проблема**: API маршруты не имеют явных CORS заголовков.

**Рекомендация**: Добавить middleware для API маршрутов:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();

    response.headers.set("Access-Control-Allow-Origin", "https://web.telegram.org");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Init-Data");

    return response;
  }
}
```

---

### 🟡 СРЕДНИЙ-11: Console.log Заявления в Продакшене

**Файлы**: Множественные файлы содержат заявления `console.log`.

**Рекомендация**: Удалить или заменить на правильное логирование:
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
```

---

### 🟡 СРЕДНИЙ-12: Отсутствуют Комментарии Prisma Schema

**Файл**: `prisma/schema.prisma`

**Рекомендация**: Добавить JSDoc комментарии для лучшей документации:
```prisma
/// Учетная запись пользователя, связанная с Telegram
model User {
  /// Telegram user ID (уникальный)
  telegramId String @unique

  /// Имя пользователя в Telegram (опционально)
  username   String?
}
```

---

### 🟡 СРЕДНИЙ-13: Нет Индексов Базы Данных

**Файл**: `prisma/schema.prisma`

**Проблема**: Отсутствуют индексы на часто запрашиваемых полях.

**Рекомендация**: Добавить индексы:
```prisma
model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique
  userId      String
  productId   String
  status      OrderStatus
  createdAt   DateTime @default(now())

  @@index([userId])        // ✅ Индекс для заказов пользователя
  @@index([status])        // ✅ Индекс для фильтрации по статусу
  @@index([createdAt])     // ✅ Индекс для сортировки по дате
  @@map("orders")
}
```

---

### 🟡 СРЕДНИЙ-14: Избыточные API Вызовы на Странице Админа

**Файл**: `app/admin/page.tsx`

**Проблема**: Получает все данные при каждом редактировании вместо оптимистичных обновлений.

**Рекомендация**: Реализовать оптимистичные обновления:
```typescript
const handleProductEdit = async (id: string, field: string, value: any) => {
  // ✅ Оптимистичное обновление
  setProducts(products.map(p =>
    p.id === id ? { ...p, [field]: value } : p
  ));

  try {
    await fetch("/api/products", {
      method: "PATCH",
      body: JSON.stringify({ productId: id, [field]: value }),
    });
  } catch (error) {
    // ✅ Откат при ошибке
    fetchProducts();
  }
};
```

---

### 🟡 СРЕДНИЙ-15: Отсутствует Decimal Тип для Цен

**Файл**: `prisma/schema.prisma`

**Проблема**: Использование `Float` для цен может вызвать ошибки округления.

**Текущее**:
```prisma
model ProductVariant {
  basePrice    Float
  currentPrice Float
}
```

**Рекомендация**: Использовать `Decimal`:
```prisma
model ProductVariant {
  basePrice    Decimal @db.Decimal(10, 2)
  currentPrice Decimal @db.Decimal(10, 2)
}
```

---

### 🟡 СРЕДНИЙ-16: Нет Отслеживания Запасов Вариантов

**Проблема**: Система позволяет неограниченные заказы без управления запасами.

**Рекомендация**: Добавить поле инвентаря:
```prisma
model ProductVariant {
  stock Int @default(0)

  // Добавить ограничение проверки
  @@check(stock >= 0)
}
```

И валидировать перед созданием заказа:
```typescript
const variant = await prisma.productVariant.findUnique({
  where: { id: variantId }
});

if (variant.stock < 1) {
  return NextResponse.json({ error: "Нет в наличии" }, { status: 400 });
}
```

---

### 🟡 СРЕДНИЙ-17: Отсутствует Функция Отмены Заказа

**Проблема**: Пользователи не могут отменить ожидающие заказы.

**Рекомендация**: Добавить эндпоинт отмены:
```typescript
// app/api/orders/[id]/cancel/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id }
  });

  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "Можно отменить только ожидающие заказы" },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id: params.id },
    data: { status: "CANCELLED" }
  });
}
```

---

### 🟡 СРЕДНИЙ-18: Нет Пагинации на Заказах/Отзывах

**Файлы**:
- `app/api/orders/route.ts`
- `app/api/reviews/route.ts`

**Проблема**: Получает все записи без пагинации.

**Рекомендация**: Добавить пагинацию на основе курсора:
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "20");

  const orders = await prisma.order.findMany({
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = orders.length > limit;
  const items = hasMore ? orders.slice(0, -1) : orders;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
```

---

### 🟡 СРЕДНИЙ-19: Несогласованное Форматирование Дат

**Проблема**: Смешение `toLocaleDateString` и сырых дат.

**Рекомендация**: Создать утилиту:
```typescript
// lib/dateUtils.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
```

---

## Проблемы Низкого Приоритета

### ⚪ НИЗКИЙ-1: Отсутствует Favicon

**Рекомендация**: Добавить `app/favicon.ico`

---

### ⚪ НИЗКИЙ-2: Нет Meta Тегов для SEO

**Файл**: `app/layout.tsx`

**Рекомендация**: Добавить метаданные:
```typescript
export const metadata = {
  title: "StarShop - Донаты и подписки",
  description: "Магазин игровых донатов и подписок на сервисы",
  icons: {
    icon: "/favicon.ico",
  },
};
```

---

### ⚪ НИЗКИЙ-3: Жестко Закодированный Текст Вместо i18n

**Проблема**: Весь текст жестко закодирован на русском, нет поддержки интернационализации.

**Рекомендация**: Если планируется поддержка нескольких языков, использовать next-intl.

---

### ⚪ НИЗКИЙ-4: Нет Переключателя Темной/Светлой Темы

**Рекомендация**: Реализовать переключение темы используя параметры темы Telegram:
```typescript
const themeParams = window.Telegram?.WebApp?.themeParams;
document.documentElement.style.setProperty("--background", themeParams.bg_color);
```

---

### ⚪ НИЗКИЙ-5: Отсутствует Robots.txt

**Рекомендация**: Добавить `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

---

### ⚪ НИЗКИЙ-6: Нет Интеграции Аналитики

**Рекомендация**: Добавить Vercel Analytics:
```bash
bun add @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

### ⚪ НИЗКИЙ-7: Отсутствуют TypeScript Path Aliases

**Проблема**: Только алиас `@/*` настроен.

**Рекомендация**: Добавить больше алиасов в `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

---

### ⚪ НИЗКИЙ-8: Нет Конфигурации Prettier

**Рекомендация**: Добавить `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2
}
```

---

## План Исправлений

### Фаза 1: Критические Исправления Безопасности (Неделя 1)

**Приоритет**: Требуются немедленные действия

1. ✅ Реализовать аутентификацию Telegram initData на всех API маршрутах
2. ✅ Добавить проверки авторизации админа
3. ✅ Валидировать подписи webhook
4. ✅ Добавить валидацию загрузки файлов
5. ✅ Белый список полей PATCH эндпоинтов
6. ✅ Исправить несанкционированный доступ к заказам
7. ✅ Удалить доверие к user ID из localStorage

**Ориентировочные усилия**: 2-3 дня

---

### Фаза 2: Исправления Высокого Приоритета (Неделя 2)

**Приоритет**: Важная функциональность и стабильность

1. ✅ Добавить rate limiting
2. ✅ Реализовать валидацию переходов статусов заказов
3. ✅ Исправить race conditions при создании заказа
4. ✅ Добавить error boundary
5. ✅ Санитизировать контент отзывов
6. ✅ Оптимизировать запросы к базе данных
7. ✅ Валидировать переменные окружения при запуске
8. ✅ Исправить инициализацию Telegram бота
9. ✅ Улучшить singleton Prisma client

**Ориентировочные усилия**: 3-4 дня

---

### Фаза 3: Улучшения Среднего Приоритета (Недели 3-4)

**Приоритет**: Качество кода и пользовательский опыт

1. ✅ Переключиться на миграции Prisma
2. ✅ Добавить индексы базы данных
3. ✅ Реализовать пагинацию
4. ✅ Добавить состояния загрузки
5. ✅ Оптимизировать изображения с Next.js Image
6. ✅ Добавить систему правильного логирования
7. ✅ Реализовать оптимистичные обновления
8. ✅ Добавить функцию отмены заказа
9. ✅ Исправить TypeScript strict null checks
10. ✅ Стандартизировать сообщения об ошибках
11. ✅ Добавить конфигурацию CORS
12. ✅ Использовать тип Decimal для цен
13. ✅ Добавить отслеживание запасов вариантов
14. ✅ Дедуплицировать код инициализации Telegram
15. ✅ Исправить использование React key
16. ✅ Согласованное форматирование дат
17. ✅ Добавить документацию схемы
18. ✅ Указать версию Node
19. ✅ Удалить console.logs

**Ориентировочные усилия**: 5-7 дней

---

### Фаза 4: Полировка Низкого Приоритета (Постоянно)

**Приоритет**: Было бы неплохо иметь

1. ⚪ Добавить favicon
2. ⚪ Добавить SEO meta теги
3. ⚪ Добавить аналитику
4. ⚪ Добавить robots.txt
5. ⚪ Настроить Prettier
6. ⚪ Добавить больше TypeScript path aliases
7. ⚪ Реализация переключателя темы
8. ⚪ Рассмотреть i18n для будущего

**Ориентировочные усилия**: 1-2 дня

---

## Рекомендации по Тестированию

После реализации исправлений, выполните следующие тесты:

### Тестирование Безопасности
- [ ] Попытка доступа к API эндпоинтам без аутентификации
- [ ] Попытка просмотра заказов других пользователей
- [ ] Тестирование загрузки файлов с неверными типами/размерами файлов
- [ ] Отправка фальшивых webhook запросов
- [ ] Попытка SQL инъекции во всех текстовых полях

### Функциональное Тестирование
- [ ] Завершение потока заказа от выбора до завершения
- [ ] Тестирование переходов статусов заказов
- [ ] Проверка публикации отзывов в канал Telegram
- [ ] Тестирование редактирования продуктов/вариантов в панели админа
- [ ] Проверка предотвращения дублирования заказов

### Тестирование Производительности
- [ ] Нагрузочное тестирование API эндпоинтов
- [ ] Тестирование с 100+ продуктами
- [ ] Проверка производительности запросов к БД с индексами

---

## Заключение

Эта кодовая база имеет прочную основу, но требует немедленного внимания к критическим уязвимостям безопасности. Система аутентификации должна быть реализована перед развертыванием в продакшн.

**Рекомендуемые Следующие Шаги**:
1. Устранить все КРИТИЧЕСКИЕ проблемы перед развертыванием в продакшн
2. Реализовать комплексное тестирование
3. Настроить мониторинг и отслеживание ошибок (например, Sentry)
4. Документировать API эндпоинты с помощью OpenAPI/Swagger
5. Создать окружения разработки/стейджинга

**Позитивные Моменты**:
- Чистая структура проекта
- Хорошее использование Next.js App Router
- Хорошо спроектированная схема Prisma
- Хорошее разделение ответственностей

С рекомендованными исправлениями, это будет надежная и безопасная платформа электронной коммерции для Telegram Mini Apps.

---

**Ревью завершено**: 2025-11-16
**Всего проблем**: 43 (7 Критических, 9 Высоких, 19 Средних, 8 Низких)
