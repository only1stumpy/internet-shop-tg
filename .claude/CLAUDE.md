- 📱 Базовая инициализация Telegram Mini App (универсальная)

  🎯 Минимальный стек

  {
  "dependencies": {
  "next": "^16.0.0",
  "react": "^19.1.0",
  "@telegram-apps/init-data-node": "^2.0.10"
  }
  }

  ***

  1️⃣ Загрузка Telegram Web App SDK

  src/app/layout.tsx

  import Script from "next/script";

  export default function RootLayout({ children }) {
  return (
  <html lang="ru">
  <head>
  {/_ Загружаем SDK ПЕРЕД рендерингом _/}
  <Script
            src="https://telegram.org/js/telegram-web-app.js"
            strategy="beforeInteractive"
          />
  </head>
  <body>{children}</body>
  </html>
  );
  }

  ***

  2️⃣ Инициализация в Providers

  src/app/providers.tsx

  "use client";

  import { useEffect } from "react";

  export default function Providers({ children }) {
  useEffect(() => {
  if (typeof window !== "undefined") {
  const tg = window.Telegram?.WebApp;

        if (tg) {
          console.log("✅ Telegram Web App инициализирован");

          // Базовая инициализация
          tg.ready();                           // Сигнал готовности
          tg.expand();                          // Развернуть на весь экран
          tg.disableVerticalSwipes?.();         // Отключить свайпы для закрытия

          // Настройка темы
          tg.setHeaderColor?.("secondary_bg_color");

          // CSS переменные для safe areas
          const safeAreaTop = tg.safeAreaInset?.top || 0;
          document.documentElement.style.setProperty(
            "--tg-safe-area-inset-top",
            `${safeAreaTop}px`
          );

          const safeAreaBottom = tg.safeAreaInset?.bottom || 0;
          document.documentElement.style.setProperty(
            "--tg-safe-area-inset-bottom",
            `${safeAreaBottom}px`
          );

          // Логируем данные пользователя
          console.log("👤 User:", tg.initDataUnsafe?.user);
          console.log("🎨 Theme:", tg.themeParams);
          console.log("🔑 InitData:", tg.initData);
        } else {
          console.error("❌ Telegram Web App не найден");
        }
      }

  }, []);

  return <>{children}</>;
  }

  ***

  3️⃣ Environment Variables

  .env.local

  # Telegram Bot Token (получить у @BotFather)

  BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

  ***

  4️⃣ Валидация initData на сервере

  src/lib/telegramAuth.ts

  import { validate } from "@telegram-apps/init-data-node";

  export interface TelegramInitData {
  hash: string;
  auth_date: string;
  \_raw?: string; // Оригинальная строка
  [key: string]: string | undefined;
  }

  /\*\*

  - Валидирует Telegram initData
    \*/
    export function validateTelegramAuth(initData: TelegramInitData): boolean {
    try {
    const botToken = process.env.BOT_TOKEN;

        if (!botToken) {
          console.error("BOT_TOKEN не настроен");
          return false;
        }

        if (!initData._raw) {
          console.error("Нет оригинальной строки _raw в initData");
          return false;
        }

        // ВАЖНО: Используем оригинальную строку БЕЗ изменений
        validate(initData._raw, botToken, {
          expiresIn: 24 * 60 * 60, // 24 часа
        });

        return true;

    } catch (error) {
    console.error("Ошибка валидации Telegram initData:", error);
    return false;
    }
    }

  /\*\*

  - Извлекает initData из заголовков запроса
    \*/
    export async function extractTelegramInitData(
    req: Request
    ): Promise<TelegramInitData | null> {
    try {
    // Проверяем заголовок
    const headerData = req.headers.get("X-Telegram-Init-Data");

        if (headerData) {
          return parseInitDataString(headerData);
        }

        // Проверяем body
        const contentType = req.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const body = await req.json();
          if (body.initData) {
            return typeof body.initData === "string"
              ? parseInitDataString(body.initData)
              : body.initData;
          }
        }

        return null;

    } catch (error) {
    console.error("Ошибка извлечения initData:", error);
    return null;
    }
    }

  /\*\*

  - Парсит строку initData в объект
    \*/
    function parseInitDataString(initDataString: string): TelegramInitData {
    const params = new URLSearchParams(initDataString);
    const initData: TelegramInitData = {
    hash: "",
    auth_date: "",
    \_raw: initDataString, // СОХРАНЯЕМ оригинальную строку!
    };

  params.forEach((value, key) => {
  initData[key] = value;
  });

  return initData;
  }

  ***

  5️⃣ Извлечение данных пользователя

  src/lib/telegramUtils.ts

  export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  }

  /\*\*

  - Парсит initData и извлекает информацию о пользователе
    \*/
    export function parseTelegramInitData(initData: string): TelegramUser | null {
    try {
    const params = new URLSearchParams(initData);
    const userParam = params.get("user");

        if (!userParam) {
          return null;
        }

        const user = JSON.parse(decodeURIComponent(userParam));

        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
        };

    } catch (error) {
    console.error("Ошибка парсинга Telegram initData:", error);
    return null;
    }
    }

  ***

  6️⃣ Client-side: Автоматическая отправка initData

  src/lib/apiClient.ts

  /\*\*

  - Получает Telegram initData для аутентификации
    \*/
    function getTelegramInitData(): string | null {
    try {
    const tg = window.Telegram?.WebApp;

        if (!tg || !tg.initData) {
          console.warn("⚠️ Telegram initData недоступны");
          return null;
        }

        return tg.initData;

    } catch (error) {
    console.error("❌ Ошибка получения initData:", error);
    return null;
    }
    }

  /\*\*

  - Создаёт заголовки с Telegram аутентификацией
    \*/
    export function createAuthHeaders(
    additionalHeaders?: Record<string, string>
    ): Headers {
    const headers = new Headers(additionalHeaders);

  const initData = getTelegramInitData();

  if (initData) {
  headers.set("X-Telegram-Init-Data", initData);
  }

  return headers;
  }

  /\*\*

  - Fetch с автоматическим добавлением Telegram аутентификации
    \*/
    export async function authenticatedFetch(
    url: string,
    options?: RequestInit
    ): Promise<Response> {
    const headers = createAuthHeaders(
    options?.headers as Record<string, string>
    );

  if (options?.body && typeof options.body === "string") {
  headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
  ...options,
  headers,
  });
  }

  ***

  7️⃣ API Route пример

  src/app/api/user/route.ts

  import { NextRequest, NextResponse } from "next/server";
  import {
  extractTelegramInitData,
  validateTelegramAuth
  } from "@/lib/telegramAuth";
  import { parseTelegramInitData } from "@/lib/telegramUtils";

  export async function POST(req: NextRequest) {
  try {
  // 1. Извлекаем initData
  const initData = await extractTelegramInitData(req);

      // 2. Валидируем
      if (!initData || !validateTelegramAuth(initData)) {
        return NextResponse.json(
          { error: "Неавторизованный запрос" },
          { status: 401 }
        );
      }

      // 3. Извлекаем данные пользователя
      const telegramUser = parseTelegramInitData(initData._raw || "");

      if (!telegramUser) {
        return NextResponse.json(
          { error: "Некорректные данные пользователя" },
          { status: 400 }
        );
      }

      // 4. Ваша логика (например, сохранение в БД)
      console.log("✅ Пользователь:", {
        id: telegramUser.id,
        name: telegramUser.first_name,
        username: telegramUser.username,
      });

      return NextResponse.json({
        success: true,
        user: telegramUser,
      });

  } catch (error) {
  console.error("❌ Ошибка API:", error);
  return NextResponse.json(
  { error: "Ошибка сервера" },
  { status: 500 }
  );
  }
  }

  ***

  8️⃣ Client-side использование

  src/app/page.tsx

  "use client";

  import { useEffect, useState } from "react";
  import { authenticatedFetch } from "@/lib/apiClient";

  export default function Page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function initUser() {
  try {
  // Проверяем, что мы в Telegram
  const tg = window.Telegram?.WebApp;

          if (!tg || !tg.initData) {
            console.error("❌ Не в Telegram Mini App");
            setLoading(false);
            return;
          }

          // Делаем запрос с автоматической аутентификацией
          const response = await authenticatedFetch("/api/user", {
            method: "POST",
            body: JSON.stringify({}),
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          }
        } catch (error) {
          console.error("Ошибка:", error);
        } finally {
          setLoading(false);
        }
      }

      initUser();

  }, []);

  if (loading) return <div>Загрузка...</div>;

  if (!user) return <div>Пожалуйста, откройте через Telegram</div>;

  return (
  <div>
  <h1>Привет, {user.first_name}!</h1>
  {user.username && <p>@{user.username}</p>}
  </div>
  );
  }

  ***

  9️⃣ TypeScript декларации

  src/types/telegram.d.ts

  interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
  user?: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  };
  auth_date?: number;
  hash?: string;
  };
  themeParams: {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  };
  viewportHeight: number;
  viewportStableHeight: number;
  safeAreaInset?: {
  top: number;
  bottom: number;
  left: number;
  right: number;
  };
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  close: () => void;
  }

  interface Window {
  Telegram?: {
  WebApp: TelegramWebApp;
  };
  }

  ***

  ✅ Чеклист для нового проекта

  1. ✅ Установить @telegram-apps/init-data-node
  2. ✅ Добавить Telegram Web App SDK в layout.tsx
  3. ✅ Создать providers.tsx с инициализацией
  4. ✅ Скопировать telegramAuth.ts (валидация)
  5. ✅ Скопировать telegramUtils.ts (парсинг)
  6. ✅ Скопировать apiClient.ts (автоматические заголовки)
  7. ✅ Добавиь BOT_TOKEN в .env
  8. ✅ Создать API route с валидацией
  9. ✅ Добавить TypeScript типы

  ***

  🎯 Ключевые моменты

  1. Всегда сохраняйте \_raw - оригинальная строка для валидации
  2. Валидация на сервере - HMAC-SHA256 через библиотеку
  3. initData в заголовке - X-Telegram-Init-Data для всех запросов
  4. Safe areas - CSS переменные для отступов
  5. Проверка окружения - window.Telegram?.WebApp обязательна

  ***
